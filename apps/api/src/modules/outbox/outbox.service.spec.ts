import { OutboxService } from "./outbox.service";

describe("OutboxService delivery state", () => {
  function build() {
    const prisma = {
      outboxEvent: {
        findMany: jest.fn().mockResolvedValue([]),
        update: jest.fn().mockResolvedValue({}),
      },
    } as any;
    return { service: new OutboxService(prisma), prisma };
  }

  it("only fetches due, live rows", async () => {
    const { service, prisma } = build();
    await service.getUnpublishedEvents(25);

    expect(prisma.outboxEvent.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          publishedAt: null,
          deadAt: null,
          OR: [
            { nextAttemptAt: null },
            { nextAttemptAt: { lte: expect.any(Date) } },
          ],
        }),
        take: 25,
      }),
    );
  });

  it("clears the retry time when marking as published", async () => {
    const { service, prisma } = build();
    await service.markAsPublished("event-1");

    expect(prisma.outboxEvent.update).toHaveBeenCalledWith({
      where: { id: "event-1" },
      data: { publishedAt: expect.any(Date), nextAttemptAt: null },
    });
  });

  it("increments retries and stores the backoff deadline", async () => {
    const { service, prisma } = build();
    const next = new Date("2026-11-19T12:01:00.000Z");
    await service.markAsFailed("event-1", "http-500", next);

    expect(prisma.outboxEvent.update).toHaveBeenCalledWith({
      where: { id: "event-1" },
      data: {
        retryCount: { increment: 1 },
        lastError: "http-500",
        nextAttemptAt: next,
      },
    });
  });

  it("stamps a dead-letter time and stops retrying", async () => {
    const { service, prisma } = build();
    await service.markAsDead("event-1", "http-400");

    expect(prisma.outboxEvent.update).toHaveBeenCalledWith({
      where: { id: "event-1" },
      data: {
        retryCount: { increment: 1 },
        lastError: "http-400",
        nextAttemptAt: null,
        deadAt: expect.any(Date),
      },
    });
  });
});
