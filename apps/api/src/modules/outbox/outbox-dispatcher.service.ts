import { Injectable, Logger } from "@nestjs/common";
import type { OutboxEvent } from "@prisma/client";
import { runWithTenantId, getTenantId } from "../../common/prisma/tenant-context";
import { PrismaService } from "../tenants/prisma.service";
import {
  outboxBackoffMs,
  outboxBatchSize,
  outboxMaxAttempts,
  outboxMaxTenantsPerSweep,
} from "./outbox-delivery.constants";
import { OutboxService } from "./outbox.service";
import { HttpOutboxTransport } from "./http-outbox.transport";
import type { OutboxEnvelope } from "./outbox.types";

export interface OutboxSweepResult {
  skipped: boolean;
  tenants: number;
  examined: number;
  delivered: number;
  retried: number;
  dead: number;
  failedTenants: number;
}

const EMPTY_RESULT: OutboxSweepResult = {
  skipped: true,
  tenants: 0,
  examined: 0,
  delivered: 0,
  retried: 0,
  dead: 0,
  failedTenants: 0,
};

/**
 * Tenant-scoped outbox relay.
 *
 * The sweep itself runs without a tenant context and calls one narrowly scoped
 * SECURITY DEFINER function to discover tenant IDs. Every event read/write then
 * re-enters runWithTenantId(), so FORCE RLS still protects the payload rows.
 */
@Injectable()
export class OutboxDispatcherService {
  private readonly logger = new Logger(OutboxDispatcherService.name);
  private disabledLogged = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly outbox: OutboxService,
    private readonly transport: HttpOutboxTransport,
  ) {}

  async sweep(): Promise<OutboxSweepResult> {
    if (!this.transport.enabled) {
      if (!this.disabledLogged) {
        this.disabledLogged = true;
        this.logger.log(
          `Outbox dispatcher idle: ${this.transport.disabledReason}.`,
        );
      }
      return { ...EMPTY_RESULT };
    }

    let tenantIds: string[];
    try {
      tenantIds = await this.listActiveTenantIds();
    } catch (error) {
      this.logger.error(
        `Outbox dispatcher could not list tenants: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      return { ...EMPTY_RESULT, skipped: false };
    }

    const result: OutboxSweepResult = {
      skipped: false,
      tenants: 0,
      examined: 0,
      delivered: 0,
      retried: 0,
      dead: 0,
      failedTenants: 0,
    };
    const maxTenants = outboxMaxTenantsPerSweep();

    for (const tenantId of tenantIds.slice(0, maxTenants)) {
      result.tenants += 1;
      try {
        const tenantResult = await runWithTenantId(tenantId, () =>
          this.sweepTenant(tenantId),
        );
        result.examined += tenantResult.examined;
        result.delivered += tenantResult.delivered;
        result.retried += tenantResult.retried;
        result.dead += tenantResult.dead;
      } catch (error) {
        result.failedTenants += 1;
        this.logger.warn(
          `Outbox sweep failed for tenant ${tenantId}: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      }
    }

    if (result.delivered || result.retried || result.dead || result.failedTenants) {
      this.logger.log(
        `Outbox sweep: tenants=${result.tenants} examined=${result.examined} delivered=${result.delivered} retried=${result.retried} dead=${result.dead} failedTenants=${result.failedTenants}`,
      );
    }

    return result;
  }

  private async listActiveTenantIds(): Promise<string[]> {
    const rows = await this.prisma.$queryRaw<Array<{ tenant_id: string }>>`
      SELECT tenant_id FROM app_list_active_tenant_ids()
    `;
    return rows.map((row) => row.tenant_id).filter(Boolean);
  }

  private async sweepTenant(tenantId: string): Promise<{
    examined: number;
    delivered: number;
    retried: number;
    dead: number;
  }> {
    // Defensive: the caller always enters the tenant scope, but the check
    // makes a future refactor fail visibly instead of reading the wrong rows.
    if (getTenantId() !== tenantId) {
      throw new Error("outbox-tenant-context-mismatch");
    }

    const events = await this.outbox.getUnpublishedEvents(outboxBatchSize());
    const now = Date.now();
    const maxAttempts = outboxMaxAttempts();
    const counts = { examined: 0, delivered: 0, retried: 0, dead: 0 };

    for (const event of events) {
      if (
        event.tenantId !== tenantId ||
        event.publishedAt ||
        event.deadAt ||
        (event.nextAttemptAt && event.nextAttemptAt.getTime() > now)
      ) {
        continue;
      }

      counts.examined += 1;
      const result = await this.deliverSafely(event);
      if (result.ok) {
        await this.outbox.markAsPublished(event.id);
        counts.delivered += 1;
        continue;
      }

      const error = result.error || "outbox-delivery-failed";
      const attempt = event.retryCount + 1;

      if (!result.retryable || attempt >= maxAttempts) {
        await this.outbox.markAsDead(event.id, error);
        counts.dead += 1;
        this.logger.warn(
          `Outbox event dead-lettered: tenant=${tenantId} event=${event.id} type=${event.eventType} attempt=${attempt} error=${error}`,
        );
        continue;
      }

      await this.outbox.markAsFailed(
        event.id,
        error,
        new Date(now + outboxBackoffMs(attempt)),
      );
      counts.retried += 1;
    }

    return counts;
  }

  private async deliverSafely(event: OutboxEvent) {
    try {
      return await this.transport.deliver(this.toEnvelope(event));
    } catch (error) {
      return {
        ok: false,
        retryable: true,
        error: error instanceof Error ? error.message : "transport-error",
      };
    }
  }

  private toEnvelope(event: OutboxEvent): OutboxEnvelope {
    return {
      id: event.id,
      type: event.eventType,
      version: event.eventVersion,
      tenantId: event.tenantId,
      occurredAt: event.createdAt.toISOString(),
      aggregate: {
        type: event.aggregateType,
        id: event.aggregateId,
      },
      payload: event.payload,
    };
  }
}
