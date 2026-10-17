import { Injectable, ConflictException } from "@nestjs/common";
import { PrismaService } from "../../tenants/prisma.service";
import { Prisma, IdempotencyStatus } from "@prisma/client";
import * as crypto from "crypto";
import { stableStringify } from "../../../common/serialization/json";

const KEY_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

@Injectable()
export class IdempotencyService {
  constructor(private prisma: PrismaService) {}

  /**
   * Claim an idempotency key for this request.
   *
   * Semantics (audit 2026-10-17 review, bundle A):
   *  - COMPLETED (not expired)  → replay the stored response.
   *  - PENDING, same payload    → `isNew: false`; the caller decides whether to
   *                               resume the in-flight attempt or return.
   *  - PENDING, different body  → 409 (key reuse).
   *  - FAILED / expired         → RENEW the same row in place. The old code
   *                               fell through to `create` here, which is a
   *                               guaranteed P2002 against the unique
   *                               (tenantId, key) index and bricked the key.
   */
  async checkAndStore(
    tenantId: string,
    userId: string | undefined,
    key: string,
    operation: string,
    requestData: any,
  ): Promise<{ isNew: boolean; existingId?: string; response?: any }> {
    const requestHash = this.hashRequest(requestData);

    const existing = await this.prisma.idempotencyKey.findUnique({
      where: { tenantId_key: { tenantId, key } },
    });

    if (existing) {
      const expired = existing.expiresAt < new Date();

      if (!expired && existing.status === "COMPLETED") {
        return {
          isNew: false,
          existingId: existing.id,
          response: existing.responseHash
            ? JSON.parse(existing.responseHash)
            : undefined,
        };
      }

      if (!expired && existing.status === "PENDING") {
        if (existing.requestHash === requestHash) {
          return { isNew: false, existingId: existing.id };
        }
        throw new ConflictException(
          "Idempotency key reused with different request",
        );
      }

      // A non-expired FAILED key must still belong to the same payload;
      // anything else is key reuse.
      if (!expired && existing.requestHash !== requestHash) {
        throw new ConflictException(
          "Idempotency key reused with different request",
        );
      }

      // Renew in place: `create` would violate the unique (tenantId, key).
      const renewed = await this.prisma.idempotencyKey.update({
        where: { id: existing.id },
        data: {
          status: "PENDING",
          requestHash,
          responseHash: null,
          expiresAt: new Date(Date.now() + KEY_TTL_MS),
        },
      });
      return { isNew: true, existingId: renewed.id };
    }

    const newKey = await this.prisma.idempotencyKey.create({
      data: {
        tenantId,
        userId,
        key,
        operation,
        requestHash,
        status: "PENDING",
        expiresAt: new Date(Date.now() + KEY_TTL_MS),
      },
    });

    return { isNew: true, existingId: newKey.id };
  }

  async markCompleted(
    tenantId: string,
    key: string,
    responseData: any,
  ): Promise<void> {
    // stableStringify is BigInt-safe and key-order-stable; the replay path
    // JSON.parses this column, so the output must stay valid JSON.
    const responseHash = stableStringify(responseData);
    await this.prisma.idempotencyKey.update({
      where: { tenantId_key: { tenantId, key } },
      data: { status: "COMPLETED", responseHash },
    });
  }

  async markFailed(tenantId: string, key: string): Promise<void> {
    // PENDING-only: never stomp a key that another attempt already completed.
    await this.prisma.idempotencyKey.updateMany({
      where: { tenantId, key, status: "PENDING" },
      data: { status: "FAILED" },
    });
  }

  async getStatus(
    tenantId: string,
    key: string,
  ): Promise<IdempotencyStatus | null> {
    const record = await this.prisma.idempotencyKey.findUnique({
      where: { tenantId_key: { tenantId, key } },
      select: { status: true },
    });
    return record?.status || null;
  }

  private hashRequest(data: any): string {
    return crypto
      .createHash("sha256")
      .update(stableStringify(data))
      .digest("hex");
  }

  async cleanupExpired(): Promise<number> {
    const result = await this.prisma.idempotencyKey.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
    return result.count;
  }
}
