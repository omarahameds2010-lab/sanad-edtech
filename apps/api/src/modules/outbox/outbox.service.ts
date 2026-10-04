import { Injectable } from '@nestjs/common';
import { PrismaService } from '../tenants/prisma.service';

interface OutboxEvent {
  eventType: string;
  eventVersion?: number;
  aggregateType: string;
  aggregateId: string;
  payload: any;
}

@Injectable()
export class OutboxService {
  constructor(private prisma: PrismaService) {}

  async publish(tenantId: string, event: OutboxEvent) {
    return this.prisma.outboxEvent.create({
      data: {
        tenantId,
        eventType: event.eventType,
        eventVersion: event.eventVersion || 1,
        aggregateType: event.aggregateType,
        aggregateId: event.aggregateId,
        payload: event.payload,
      },
    });
  }

  async getUnpublishedEvents(limit = 100) {
    return this.prisma.outboxEvent.findMany({
      where: { publishedAt: null },
      orderBy: { createdAt: 'asc' },
      take: limit,
    });
  }

  async markAsPublished(id: string) {
    return this.prisma.outboxEvent.update({
      where: { id },
      data: { publishedAt: new Date() },
    });
  }

  async markAsFailed(id: string, error: string) {
    return this.prisma.outboxEvent.update({
      where: { id },
      data: {
        retryCount: { increment: 1 },
        lastError: error,
      },
    });
  }
}
