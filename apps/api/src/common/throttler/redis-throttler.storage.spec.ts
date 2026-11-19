import { RedisThrottlerStorage } from "./redis-throttler.storage";

function redisMock() {
  return {
    eval: jest.fn(),
    on: jest.fn(),
    connect: jest.fn().mockResolvedValue(undefined),
    quit: jest.fn().mockResolvedValue(undefined),
    disconnect: jest.fn(),
  };
}

describe("RedisThrottlerStorage", () => {
  const storages: RedisThrottlerStorage[] = [];

  function storageFor(redis: ReturnType<typeof redisMock>) {
    const storage = new RedisThrottlerStorage(redis as any);
    storages.push(storage);
    return storage;
  }

  afterEach(async () => {
    await Promise.all(storages.map((storage) => storage.onApplicationShutdown()));
    storages.length = 0;
  });

  it("increments a prefixed Redis key with the configured ttl", async () => {
    const redis = redisMock();
    redis.eval.mockResolvedValue([3, 42_000]);
    const storage = storageFor(redis);

    await expect(storage.increment("abc", 60_000)).resolves.toEqual({
      totalHits: 3,
      timeToExpire: 42_000,
    });

    expect(redis.eval).toHaveBeenCalledWith(
      expect.stringContaining("PEXPIRE"),
      1,
      "sanad:throttle:abc",
      60_000,
    );
  });

  it("falls back to the in-memory store when Redis fails", async () => {
    const redis = redisMock();
    redis.eval.mockRejectedValue(new Error("connection refused"));
    const storage = storageFor(redis);

    const first = await storage.increment("abc", 60_000);
    const second = await storage.increment("abc", 60_000);

    expect(first.totalHits).toBe(1);
    expect(second.totalHits).toBe(2);
    expect(second.timeToExpire).toBeGreaterThan(0);
  });

  it("resumes Redis counting after a reconnect", async () => {
    const redis = redisMock();
    redis.eval
      .mockRejectedValueOnce(new Error("connection refused"))
      .mockResolvedValueOnce([9, 10_000]);
    const storage = storageFor(redis);

    expect((await storage.increment("abc", 60_000)).totalHits).toBe(1);
    await expect(storage.increment("abc", 60_000)).resolves.toEqual({
      totalHits: 9,
      timeToExpire: 10_000,
    });
  });

  it("stops the Redis client on shutdown", async () => {
    const redis = redisMock();
    const storage = storageFor(redis);

    await storage.onApplicationShutdown();

    expect(redis.quit).toHaveBeenCalledTimes(1);
  });

  it("disconnects if a graceful quit fails", async () => {
    const redis = redisMock();
    redis.quit.mockRejectedValue(new Error("already closed"));
    const storage = storageFor(redis);

    await storage.onApplicationShutdown();

    expect(redis.disconnect).toHaveBeenCalledTimes(1);
  });
});
