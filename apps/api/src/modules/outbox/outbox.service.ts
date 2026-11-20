import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../tenants/prisma.service";

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

  /**
   * `tx` publishes the outbox row inside the caller's interactive transaction
   * so it commits atomically with the business writes (decision table:
   * transaction = source of truth). Callers without an open transaction keep
   * the request-scoped extended client (bundle B).
   */
  async publish(
    tenantId: string,
    event: OutboxEvent,
    tx?: Prisma.TransactionClient,
  ) {
    const db: any = tx ?? this.prisma;
    return db.outboxEvent.create({
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

  /**
   * Only due, live rows are returned. Dead-lettered or backoff-delayed rows
   * are excluded so a sweep cannot hammer a failing receiver.
   */
  async getUnpublishedEvents(limit = 100) {
    const now = new Date();
    return this.prisma.outboxEvent.findMany({
      where: {
        publishedAt: null,
        deadAt: null,
        OR: [{ nextAttemptAt: null }, { nextAttemptAt: { lte: now } }],
      },
      orderBy: { createdAt: "asc" },
      take: limit,
    });
  }

  async markAsPublished(id: string) {
    return this.prisma.outboxEvent.update({
      where: { id },
      data: { publishedAt: new Date(), nextAttemptAt: null },
    });
  }

  /**
   * Retryable failure. `retryCount` is incremented here so the next sweep sees
   * the new attempt number even if the process crashes after this write.
   */
  async markAsFailed(id: string, error: string, nextAttemptAt: Date) {
    return this.prisma.outboxEvent.update({
      where: { id },
      data: {
        retryCount: { increment: 1 },
        lastError: error,
        nextAttemptAt,
      },
    });
  }

  /** Permanent failure or retry exhaustion. */
  async markAsDead(id: string, error: string) {
    return this.prisma.outboxEvent.update({
      where: { id },
      data: {
        retryCount: { increment: 1 },
        lastError: error,
        nextAttemptAt: null,
        deadAt: new Date(),
      },
    });
  }
}
