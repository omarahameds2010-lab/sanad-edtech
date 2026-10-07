import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../tenants/prisma.service";
import { Prisma } from "@prisma/client";
import * as crypto from "crypto";

@Injectable()
export class PaymentAuditService {
  constructor(private prisma: PrismaService) {}

  async log(
    tenantId: string,
    actorId: string | undefined,
    action: string,
    resourceType: string,
    resourceId: string,
    metadata: Record<string, any> = {},
    requestId?: string,
    ip?: string,
  ): Promise<void> {
    const ipHash = ip ? this.hashIp(ip) : undefined;

    await this.prisma.paymentAuditLog.create({
      data: {
        tenantId,
        actorId,
        action,
        resourceType,
        resourceId,
        previousState: metadata.previousState,
        nextState: metadata.nextState,
        reason: metadata.reason,
        requestId,
        ipHash,
        metadata: metadata as Prisma.InputJsonValue,
      },
    });
  }

  async getPaymentAuditTrail(
    tenantId: string,
    paymentId: string,
  ): Promise<any[]> {
    return this.prisma.paymentAuditLog.findMany({
      where: { tenantId, paymentId },
      orderBy: { createdAt: "asc" },
    });
  }

  async getTenantAuditLogs(
    tenantId: string,
    filters?: {
      action?: string;
      resourceType?: string;
      actorId?: string;
      from?: Date;
      to?: Date;
    },
    limit = 100,
    offset = 0,
  ): Promise<any[]> {
    return this.prisma.paymentAuditLog.findMany({
      where: {
        tenantId,
        ...(filters?.action && { action: filters.action }),
        ...(filters?.resourceType && { resourceType: filters.resourceType }),
        ...(filters?.actorId && { actorId: filters.actorId }),
        ...(filters?.from &&
          filters?.to && {
            createdAt: { gte: filters.from, lte: filters.to },
          }),
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    });
  }

  async getActorAuditTrail(tenantId: string, actorId: string): Promise<any[]> {
    return this.prisma.paymentAuditLog.findMany({
      where: { tenantId, actorId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
  }

  private hashIp(ip: string): string {
    // Simple hash for privacy
    return crypto
      .createHash("sha256")
      .update(ip)
      .digest("hex")
      .substring(0, 32);
  }
}
