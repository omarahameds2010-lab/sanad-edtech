import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../tenants/prisma.service';
import { Prisma, IdempotencyStatus } from '@prisma/client';
import * as crypto from 'crypto';

@Injectable()
export class IdempotencyService {
  constructor(private prisma: PrismaService) {}

  async checkAndStore(
    tenantId: string,
    userId: string | undefined,
    key: string,
    operation: string,
    requestData: any,
  ): Promise<{ isNew: boolean; existingId?: string; response?: any }> {
    const requestHash = this.hashRequest(requestData);

    // Try to find existing
    const existing = await this.prisma.idempotencyKey.findUnique({
      where: { tenantId_key: { tenantId, key } },
    });

    if (existing) {
      // Check if expired
      if (existing.expiresAt < new Date()) {
        // Expired - allow new request but mark old as failed
        await this.prisma.idempotencyKey.update({
          where: { id: existing.id },
          data: { status: 'FAILED' },
        });
      } else if (existing.status === 'COMPLETED') {
        // Return cached response
        return {
          isNew: false,
          existingId: existing.id,
          response: existing.responseHash ? JSON.parse(existing.responseHash) : undefined,
        };
      } else if (existing.status === 'PENDING') {
        // Same request still processing - could be duplicate or retry
        // Check if request hash matches
        if (existing.requestHash === requestHash) {
          return { isNew: false, existingId: existing.id };
        }
        // Different request with same key - conflict
        throw new ConflictException('Idempotency key reused with different request');
      }
    }

    // Create new idempotency key
    const newKey = await this.prisma.idempotencyKey.create({
      data: {
        tenantId,
        userId,
        key,
        operation,
        requestHash,
        status: 'PENDING',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      },
    });

    return { isNew: true, existingId: newKey.id };
  }

  async markCompleted(tenantId: string, key: string, responseData: any): Promise<void> {
    const responseHash = this.hashRequest(responseData);
    await this.prisma.idempotencyKey.update({
      where: { tenantId_key: { tenantId, key } },
      data: { status: 'COMPLETED', responseHash },
    });
  }

  async markFailed(tenantId: string, key: string): Promise<void> {
    await this.prisma.idempotencyKey.update({
      where: { tenantId_key: { tenantId, key } },
      data: { status: 'FAILED' },
    });
  }

  async getStatus(tenantId: string, key: string): Promise<IdempotencyStatus | null> {
    const record = await this.prisma.idempotencyKey.findUnique({
      where: { tenantId_key: { tenantId, key } },
      select: { status: true },
    });
    return record?.status || null;
  }

  private hashRequest(data: any): string {
    const str = typeof data === 'string' ? data : JSON.stringify(data, Object.keys(data).sort());
    return crypto.createHash('sha256').update(str).digest('hex');
  }

  async cleanupExpired(): Promise<number> {
    const result = await this.prisma.idempotencyKey.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
    return result.count;
  }
}