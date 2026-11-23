import {
  DEFAULT_DEAD_LETTER_LIMIT,
  MAX_DEAD_LETTER_LIMIT,
  OutboxAdminService,
} from "./outbox-admin.service";

function build(overrides: {
  findMany?: jest.Mock;
  count?: jest.Mock;
  findFirst?: jest.Mock;
  updateMany?: jest.Mock;
  auditLog?: jest.Mock;
} = {}) {
  const prisma = {
    outboxEvent: {
      findMany:
        overrides.findMany ??
        jest.fn().mockResolvedValue([
          {
            id: "event-1",
            eventType: "payment.paid",
            eventVersion: 1,
            aggregateType: "payment",
            aggregateId: "payment-1",
            retryCount: 10,
            lastError: "http-500",
            deadAt: new Date("2026-11-22T10:00:00.000Z"),
            createdAt: new Date("2026-11-22T09:00:00.000Z"),
          },
        ]),
      count: overrides.count ?? jest.fn().mockResolvedValue(1),
      findFirst:
        overrides.findFirst ??
        jest.fn().mockResolvedValue({
          id: "event-1",
          eventType: "payment.paid",
          aggregateType: "payment",
          aggregateId: "payment-1",
          retryCount: 10,
          lastError: "http-500",
        }),
      updateMany:
        overrides.updateMany ?? jest.fn().mockResolvedValue({ count: 1 }),
    },
  } as any;
  const audit = {
    log: overrides.auditLog ?? jest.fn().mockResolvedValue({}),
  } as any;

  return {
    prisma,
    audit,
    service: new OutboxAdminService(prisma, audit),
  };
}

describe("OutboxAdminService", () => {
  it("lists only this tenant's dead letters and clamps the limit", async () => {
    const { service, prisma } = build();
    const result = await service.listDeadLetters("tenant-1", 500);

    expect(prisma.outboxEvent.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          tenantId: "tenant-1",
          publishedAt: null,
          deadAt: { not: null },
        },
        take: MAX_DEAD_LETTER_LIMIT,
      }),
    );
    expect(prisma.outboxEvent.count).toHaveBeenCalledWith({
      where: {
        tenantId: "tenant-1",
        publishedAt: null,
        deadAt: { not: null },
      },
    });
    expect(result.total).toBe(1);
    expect(result.limit).toBe(MAX_DEAD_LETTER_LIMIT);
  });

  it("uses the default limit for missing or invalid input", async () => {
    const { service, prisma } = build();
    const result = await service.listDeadLetters("tenant-1", Number.NaN);

    expect(prisma.outboxEvent.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: DEFAULT_DEAD_LETTER_LIMIT }),
    );
    expect(result.limit).toBe(DEFAULT_DEAD_LETTER_LIMIT);
  });

  it("requeues a dead letter with a fresh retry budget and audits the prior error", async () => {
    const { service, prisma, audit } = build();
    const result = await service.retryDeadLetter("tenant-1", "event-1", {
      userId: "admin-1",
      ip: "127.0.0.1",
      userAgent: "jest",
    });

    expect(prisma.outboxEvent.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: "event-1",
          tenantId: "tenant-1",
          publishedAt: null,
          deadAt: { not: null },
        },
      }),
    );
    expect(prisma.outboxEvent.updateMany).toHaveBeenCalledWith({
      where: {
        id: "event-1",
        tenantId: "tenant-1",
        publishedAt: null,
        deadAt: { not: null },
      },
      data: {
        deadAt: null,
        nextAttemptAt: expect.any(Date),
        retryCount: 0,
        lastError: null,
      },
    });
    expect(result).toMatchObject({
      id: "event-1",
      eventType: "payment.paid",
      requeued: true,
    });
    expect(audit.log).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: "tenant-1",
        actorUserId: "admin-1",
        action: "OUTBOX_DEAD_LETTER_RETRIED",
        resourceType: "outbox_event",
        resourceId: "event-1",
        metadata: expect.objectContaining({
          eventType: "payment.paid",
          previousRetryCount: 10,
          previousLastError: "http-500",
        }),
      }),
    );
    expect(audit.log.mock.calls[0][0].metadata).not.toHaveProperty("payload");
  });

  it("returns 404 when the event is not a dead letter in this tenant", async () => {
    const { service, prisma } = build({
      findFirst: jest.fn().mockResolvedValue(null),
    });

    await expect(
      service.retryDeadLetter("tenant-1", "missing"),
    ).rejects.toMatchObject({
      response: { code: "OUTBOX_DEAD_LETTER_NOT_FOUND" },
    });
    expect(prisma.outboxEvent.updateMany).not.toHaveBeenCalled();
  });

  it("returns 404 when a concurrent retry already claimed the row", async () => {
    const { service, audit } = build({
      updateMany: jest.fn().mockResolvedValue({ count: 0 }),
    });

    await expect(
      service.retryDeadLetter("tenant-1", "event-1"),
    ).rejects.toMatchObject({
      response: { code: "OUTBOX_DEAD_LETTER_NOT_FOUND" },
    });
    expect(audit.log).not.toHaveBeenCalled();
  });
});
