import { Injectable, NotFoundException } from "@nestjs/common";
import { AuditService } from "../audit/audit.service";
import { PrismaService } from "../tenants/prisma.service";

export const DEFAULT_DEAD_LETTER_LIMIT = 50;
export const MAX_DEAD_LETTER_LIMIT = 100;

export interface DeadLetterActor {
  userId?: string;
  ip?: string;
  userAgent?: string;
}

/**
 * Tenant-scoped dead-letter administration.
 *
 * The controller is ADMIN-only. Every query still carries the request tenant
 * ID explicitly and runs under the Prisma RLS extension, so a missing policy or
 * a future refactor cannot turn this into a cross-tenant read.
 */
@Injectable()
export class OutboxAdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async listDeadLetters(tenantId: string, limit?: number) {
    const take = this.clampLimit(limit);
    const where = {
      tenantId,
      publishedAt: null,
      deadAt: { not: null },
    };

    const [items, total] = await Promise.all([
      this.prisma.outboxEvent.findMany({
        where,
        orderBy: { deadAt: "desc" },
        take,
        select: {
          id: true,
          eventType: true,
          eventVersion: true,
          aggregateType: true,
          aggregateId: true,
          retryCount: true,
          lastError: true,
          deadAt: true,
          createdAt: true,
        },
      }),
      this.prisma.outboxEvent.count({ where }),
    ]);

    return { items, total, limit: take };
  }

  /**
   * Requeue one dead letter. The CAS-style update only succeeds while the row
   * is still dead and unpublished; a concurrent retry returns 404 instead of
   * silently resetting an already-live event. Retry count is reset so the
   * operator gets a fresh backoff budget; the prior error is preserved in the
   * audit log, not in the live event row.
   */
  async retryDeadLetter(
    tenantId: string,
    eventId: string,
    actor: DeadLetterActor = {},
  ) {
    const event = await this.prisma.outboxEvent.findFirst({
      where: {
        id: eventId,
        tenantId,
        publishedAt: null,
        deadAt: { not: null },
      },
      select: {
        id: true,
        eventType: true,
        aggregateType: true,
        aggregateId: true,
        retryCount: true,
        lastError: true,
      },
    });

    if (!event) {
      throw this.notFound();
    }

    const nextAttemptAt = new Date();
    const updated = await this.prisma.outboxEvent.updateMany({
      where: {
        id: eventId,
        tenantId,
        publishedAt: null,
        deadAt: { not: null },
      },
      data: {
        deadAt: null,
        nextAttemptAt,
        retryCount: 0,
        lastError: null,
      },
    });

    if (updated.count !== 1) {
      throw this.notFound();
    }

    await this.audit.log({
      tenantId,
      actorUserId: actor.userId,
      action: "OUTBOX_DEAD_LETTER_RETRIED",
      resourceType: "outbox_event",
      resourceId: event.id,
      metadata: {
        eventType: event.eventType,
        aggregateType: event.aggregateType,
        aggregateId: event.aggregateId,
        previousRetryCount: event.retryCount,
        previousLastError: event.lastError,
        nextAttemptAt: nextAttemptAt.toISOString(),
      },
      ip: actor.ip,
      userAgent: actor.userAgent,
    });

    return {
      id: event.id,
      eventType: event.eventType,
      aggregateType: event.aggregateType,
      aggregateId: event.aggregateId,
      requeued: true,
      nextAttemptAt,
    };
  }

  private clampLimit(limit?: number): number {
    if (limit === undefined) return DEFAULT_DEAD_LETTER_LIMIT;
    if (!Number.isFinite(limit) || limit <= 0) return DEFAULT_DEAD_LETTER_LIMIT;
    return Math.min(Math.floor(limit), MAX_DEAD_LETTER_LIMIT);
  }

  private notFound() {
    return new NotFoundException({
      code: "OUTBOX_DEAD_LETTER_NOT_FOUND",
      message: "Dead-lettered outbox event not found",
    });
  }
}
