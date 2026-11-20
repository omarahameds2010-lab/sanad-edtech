import { OutboxDispatchScheduler } from "./outbox-dispatch.scheduler";

describe("OutboxDispatchScheduler", () => {
  it("installs one repeatable sweep job", async () => {
    const queue = { add: jest.fn().mockResolvedValue({ id: "sweep" }) };
    const scheduler = new OutboxDispatchScheduler(queue as any);

    await scheduler.onModuleInit();

    expect(queue.add).toHaveBeenCalledTimes(1);
    const [name, data, options] = queue.add.mock.calls[0];
    expect(name).toBe("sweep");
    expect(data).toEqual({});
    expect(options).toEqual(
      expect.objectContaining({
        jobId: "sweep",
        removeOnComplete: true,
        removeOnFail: 100,
      }),
    );
    expect(options.repeat.every).toBeGreaterThan(0);
  });

  it("does not fail boot when Redis is unavailable", async () => {
    const queue = {
      add: jest.fn().mockRejectedValue(new Error("redis unavailable")),
    };
    const scheduler = new OutboxDispatchScheduler(queue as any);

    await expect(scheduler.onModuleInit()).resolves.toBeUndefined();
  });
});
