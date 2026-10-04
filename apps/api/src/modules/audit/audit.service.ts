import { Injectable } from '@nestjs/common';
import { PrismaService } from '../tenants/prisma.service';

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async log(data: {
    tenantId: string;
    actorUserId?: string;
    action: string;
    resourceType: string;
    resourceId?: string;
    metadata?: any;
    ip?: string;
    userAgent?: string;
  }) {
    return this.prisma.auditLog.create({
      data,
    });
  }

  async getTenantAuditLogs(tenantId: string, limit = 100) {
    return this.prisma.auditLog.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        actorUser: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
    });
  }
}
