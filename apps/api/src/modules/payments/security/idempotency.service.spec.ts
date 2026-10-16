import { ConflictException } from "@nestjs/common";
import { IdempotencyService } from "./idempotency.service";

/**
 * Bundle A regression suite: the old code fell through to `create` for
 * FAILED/expired keys (guaranteed P2002 against `@@unique([tenantId, key])`)
 * and hashed requests with `JSON.stringify`, which throws on BigInt.
 */
describe("IdempotencyService (bundle A lifecycle)", () => {
  let prisma: any;
  let service: IdempotencyService;

  const tenantId = "t1";
  const userId = "u1";
  const future = new Date(Date.now() + 60 * 60 * 1000);
  const past = new Date(Date.now() - 60 * 60 * 1000);

  beforeEach(() => {
    prisma = {
      idempotencyKey: {
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockImplementation(async ({ data }: any) => ({
          id: "row-new",
          ...data,
        })),
        update: jest.fn().mockImplementation(async ({ data }: any) => ({
          id: "row-1",
          ...data,
        })),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
    };
    service = new IdempotencyService(prisma);
  });

  async function currentHashFor(data: any): Promise<string> {
    prisma.idempotencyKey.findUnique.mockResolvedValueOnce(null);
    await service.checkAndStore(
      tenantId,
      userId,
      `probe-${Math.random()}`,
      "op",
      data,
    );
    const calls = prisma.idempotencyKey.create.mock.calls;
    return calls[calls.length - 1][0].data.requestHash;
  }

  it("creates a fresh key with a 24h TTL", async () => {
    const result = await service.checkAndStore(
      tenantId,
      userId,
      "k1",
      "payment_intent_create",
      { a: 1 },
    );

    expect(result.isNew).toBe(true);
    expect(prisma.idempotencyKey.create).toHaveBeenCalledTimes(1);
    const created = prisma.idempotencyKey.create.mock.calls[0][0].data;
    expect(created.status).toBe("PENDING");
    expect(created.expiresAt.getTime()).toBeGreaterThan(Date.now());
  });

  it("hashes BigInt request data safely and key-order-stably", async () => {
    const hash1 = await currentHashFor({ b: 2n, a: 1 });
    const hash2 = await currentHashFor({ a: 1, b: 2n });

    expect(hash1).toMatch(/^[0-9a-f]{64}$/);
    expect(hash2).toBe(hash1);
  });

  it("replays the stored response for a non-expired COMPLETED key", async () => {
    const data = { paymentId: "p1" };
    const hash = await currentHashFor(data);
    const createsBefore = prisma.idempotencyKey.create.mock.calls.length;

    prisma.idempotencyKey.findUnique.mockResolvedValueOnce({
      id: "row-1",
      status: "COMPLETED",
      requestHash: hash,
      responseHash: JSON.stringify({ ok: true }),
      expiresAt: future,
    });

    const result = await service.checkAndStore(
      tenantId,
      userId,
      "k1",
      "op",
      data,
    );

    expect(result.isNew).toBe(false);
    expect(result.response).toEqual({ ok: true });
    expect(prisma.idempotencyKey.create.mock.calls.length).toBe(createsBefore);
  });

  it("returns isNew=false (no response) for an in-flight PENDING key", async () => {
    const data = { a: 1 };
    const hash = await currentHashFor(data);
    prisma.idempotencyKey.findUnique.mockReset();
    prisma.idempotencyKey.findUnique.mockResolvedValueOnce({
      id: "row-1",
      status: "PENDING",
      requestHash: hash,
      responseHash: null,
      expiresAt: future,
    });

    const result = await service.checkAndStore(
      tenantId,
      userId,
      "k1",
      "op",
      data,
    );

    expect(result.isNew).toBe(false);
    expect(result.response).toBeUndefined();
    expect(prisma.idempotencyKey.update).not.toHaveBeenCalled();
  });

  it("409s when a PENDING key is reused with a different payload", async () => {
    prisma.idempotencyKey.findUnique.mockResolvedValueOnce({
      id: "row-1",
      status: "PENDING",
      requestHash: "some-other-hash",
      responseHash: null,
      expiresAt: future,
    });

    await expect(
      service.checkAndStore(tenantId, userId, "k1", "op", { a: 1 }),
    ).rejects.toThrow(ConflictException);
  });

  it("RENEWS a non-expired FAILED key with the same payload (no create → no P2002)", async () => {
    const data = { a: 1 };
    const hash = await currentHashFor(data);
    const createsBefore = prisma.idempotencyKey.create.mock.calls.length;

    prisma.idempotencyKey.findUnique.mockReset();
    prisma.idempotencyKey.findUnique.mockResolvedValueOnce({
      id: "row-1",
      status: "FAILED",
      requestHash: hash,
      responseHash: null,
      expiresAt: future,
    });

    const result = await service.checkAndStore(
      tenantId,
      userId,
      "k1",
      "op",
      data,
    );

    expect(result.isNew).toBe(true);
    expect(prisma.idempotencyKey.create.mock.calls.length).toBe(createsBefore);
    expect(prisma.idempotencyKey.update).toHaveBeenCalledWith({
      where: { id: "row-1" },
      data: expect.objectContaining({
        status: "PENDING",
        requestHash: hash,
        responseHash: null,
      }),
    });
  });

  it("409s when a FAILED key is reused with a different payload", async () => {
    prisma.idempotencyKey.findUnique.mockResolvedValueOnce({
      id: "row-1",
      status: "FAILED",
      requestHash: "some-other-hash",
      responseHash: null,
      expiresAt: future,
    });

    await expect(
      service.checkAndStore(tenantId, userId, "k1", "op", { a: 1 }),
    ).rejects.toThrow(ConflictException);
  });

  it("RENEWS an expired COMPLETED key instead of inserting (old P2002 path)", async () => {
    const createsBefore = prisma.idempotencyKey.create.mock.calls.length;

    prisma.idempotencyKey.findUnique.mockResolvedValueOnce({
      id: "row-1",
      status: "COMPLETED",
      requestHash: "old-hash",
      responseHash: JSON.stringify({ ok: true }),
      expiresAt: past,
    });

    const result = await service.checkAndStore(tenantId, userId, "k1", "op", {
      a: 1,
    });

    expect(result.isNew).toBe(true);
    expect(prisma.idempotencyKey.create.mock.calls.length).toBe(createsBefore);
    expect(prisma.idempotencyKey.update).toHaveBeenCalledTimes(1);
  });

  it("markFailed flips only PENDING keys", async () => {
    await service.markFailed(tenantId, "k1");
    expect(prisma.idempotencyKey.updateMany).toHaveBeenCalledWith({
      where: { tenantId, key: "k1", status: "PENDING" },
      data: { status: "FAILED" },
    });
  });

  it("markCompleted stores a stable, BigInt-safe JSON payload", async () => {
    await service.markCompleted(tenantId, "k1", { b: 1n, a: 2 });

    expect(prisma.idempotencyKey.update).toHaveBeenCalledWith({
      where: { tenantId_key: { tenantId, key: "k1" } },
      data: {
        status: "COMPLETED",
        responseHash: expect.any(String),
      },
    });
    const stored =
      prisma.idempotencyKey.update.mock.calls[0][0].data.responseHash;
    expect(JSON.parse(stored)).toEqual({ a: 2, b: "1" });
  });
});
