import { getTenantId } from "../../common/prisma/tenant-context";
import { OutboxDispatcherService } from "./outbox-dispatcher.service";

const ENV_KEYS = [
  "OUTBOX_BATCH_SIZE",
  "OUTBOX_MAX_ATTEMPTS",
  "OUTBOX_MAX_TENANTS_PER_SWEEP",
  "OUTBOX_SWEEP_INTERVAL_MS",
] as const;

function makeEvent(overrides: Record<string, unknown> = {}): any {
  return {
    id: "event-1",
    tenantId: "tenant-1",
    userId: null,
    eventType: "payment.paid",
    eventVersion: 1,
    aggregateType: "payment",
    aggregateId: "payment-1",
    payload: { amountMinor: "19900" },
    createdAt: new Date("2026-11-19T12:00:00.000Z"),
    publishedAt: null,
    retryCount: 0,
    lastError: null,
    nextAttemptAt: null,
    deadAt: null,
    ...overrides,
  };
}

describe("OutboxDispatcherService", () => {
  let saved: Record<string, string | undefined>;

  beforeEach(() => {
    saved = {};
    for (const key of ENV_KEYS) {
      saved[key] = process.env[key];
      delete process.env[key];
    }
  });

  afterEach(() => {
    for (const key of ENV_KEYS) {
      if (saved[key] === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = saved[key];
      }
    }
  });

  function build(
    overrides: {
      tenants?: string[];
      events?: any[];
      transportEnabled?: boolean;
      deliver?: jest.Mock;
    } = {},
  ) {
    const prisma = {
      $queryRaw: jest.fn().mockResolvedValue(
        (overrides.tenants ?? ["tenant-1"]).map((tenant_id) => ({
          tenant_id,
        })),
      ),
    } as any;
    const outbox = {
      getUnpublishedEvents: jest.fn().mockResolvedValue(overrides.events ?? []),
      markAsPublished: jest.fn().mockResolvedValue({}),
      markAsFailed: jest.fn().mockResolvedValue({}),
      markAsDead: jest.fn().mockResolvedValue({}),
    } as any;
    const transport = {
      enabled: overrides.transportEnabled ?? true,
      disabledReason: "test-disabled",
      deliver:
        overrides.deliver ??
        jest.fn().mockResolvedValue({ ok: true, retryable: false }),
    } as any;
    const deadLetterAlerter = {
      send: jest.fn().mockResolvedValue({ sent: true, skipped: false }),
    } as any;

    return {
      service: new OutboxDispatcherService(
        prisma,
        outbox,
        transport,
        deadLetterAlerter,
      ),
      prisma,
      outbox,
      transport,
      deadLetterAlerter,
    };
  }

  it("stays idle and does not query the database when no endpoint is configured", async () => {
    const { service, prisma, outbox } = build({ transportEnabled: false });

    await expect(service.sweep()).resolves.toEqual(
      expect.objectContaining({ skipped: true, tenants: 0, delivered: 0 }),
    );
    expect(prisma.$queryRaw).not.toHaveBeenCalled();
    expect(outbox.getUnpublishedEvents).not.toHaveBeenCalled();
  });

  it("sweeps every tenant inside its own RLS context", async () => {
    const { service, outbox } = build({
      tenants: ["tenant-1", "tenant-2"],
    });
    outbox.getUnpublishedEvents.mockImplementation(async () => {
      return getTenantId() === "tenant-1" ? [makeEvent()] : [];
    });

    const result = await service.sweep();

    expect(result).toEqual(
      expect.objectContaining({
        skipped: false,
        tenants: 2,
        examined: 1,
        delivered: 1,
        retried: 0,
        dead: 0,
      }),
    );
    expect(outbox.getUnpublishedEvents).toHaveBeenCalledTimes(2);
    expect(outbox.markAsPublished).toHaveBeenCalledWith("event-1");
  });

  it("records a retryable failure and schedules the retry", async () => {
    const deliver = jest.fn().mockResolvedValue({
      ok: false,
      retryable: true,
      error: "http-500",
    });
    const { service, outbox, deadLetterAlerter } = build({
      events: [makeEvent()],
      deliver,
    });

    const before = Date.now();
    const result = await service.sweep();

    expect(result).toEqual(expect.objectContaining({ retried: 1, dead: 0 }));
    expect(outbox.markAsFailed).toHaveBeenCalledTimes(1);
    const [, error, nextAttemptAt] = outbox.markAsFailed.mock.calls[0];
    expect(error).toBe("http-500");
    expect(nextAttemptAt.getTime()).toBeGreaterThanOrEqual(before + 29_000);
    expect(outbox.markAsDead).not.toHaveBeenCalled();
    expect(deadLetterAlerter.send).not.toHaveBeenCalled();
  });

  it("marks a permanent failure as dead immediately", async () => {
    const deliver = jest.fn().mockResolvedValue({
      ok: false,
      retryable: false,
      error: "http-400",
    });
    const { service, outbox, deadLetterAlerter } = build({
      events: [makeEvent()],
      deliver,
    });

    const result = await service.sweep();

    expect(result).toEqual(expect.objectContaining({ retried: 0, dead: 1 }));
    expect(outbox.markAsDead).toHaveBeenCalledWith("event-1", "http-400");
    expect(deadLetterAlerter.send).toHaveBeenCalledWith({
      tenantId: "tenant-1",
      eventId: "event-1",
      eventType: "payment.paid",
      attempt: 1,
      error: "http-400",
    });
  });

  it("marks retry exhaustion as dead", async () => {
    const deliver = jest.fn().mockResolvedValue({
      ok: false,
      retryable: true,
      error: "http-503",
    });
    const { service, outbox, deadLetterAlerter } = build({
      events: [makeEvent({ retryCount: 9 })],
      deliver,
    });

    const result = await service.sweep();

    expect(result).toEqual(expect.objectContaining({ retried: 0, dead: 1 }));
    expect(outbox.markAsDead).toHaveBeenCalledWith("event-1", "http-503");
    expect(deadLetterAlerter.send).toHaveBeenCalledWith({
      tenantId: "tenant-1",
      eventId: "event-1",
      eventType: "payment.paid",
      attempt: 10,
      error: "http-503",
    });
  });

  it("skips dead, already-published, and backoff-delayed rows", async () => {
    const { service, outbox } = build({
      events: [
        makeEvent({ id: "published", publishedAt: new Date() }),
        makeEvent({ id: "dead", deadAt: new Date() }),
        makeEvent({
          id: "later",
          nextAttemptAt: new Date(Date.now() + 60_000),
        }),
      ],
    });

    const result = await service.sweep();

    expect(result).toEqual(
      expect.objectContaining({
        examined: 0,
        delivered: 0,
        retried: 0,
        dead: 0,
      }),
    );
    expect(outbox.markAsPublished).not.toHaveBeenCalled();
  });

  it("continues with other tenants when one tenant fails", async () => {
    const { service, outbox } = build({
      tenants: ["tenant-a", "tenant-b"],
    });
    outbox.getUnpublishedEvents.mockImplementation(async () => {
      if (getTenantId() === "tenant-a") {
        throw new Error("db-error");
      }
      return [makeEvent({ tenantId: "tenant-b" })];
    });

    const result = await service.sweep();

    expect(result).toEqual(
      expect.objectContaining({
        tenants: 2,
        delivered: 1,
        failedTenants: 1,
      }),
    );
  });

  it("does not throw when the tenant directory query fails", async () => {
    const { service, prisma } = build();
    prisma.$queryRaw.mockRejectedValue(new Error("function missing"));

    await expect(service.sweep()).resolves.toEqual(
      expect.objectContaining({ skipped: false, tenants: 0 }),
    );
  });
});
