import { ExamExpiryScheduler } from "./exam-expiry.scheduler";

describe("ExamExpiryScheduler", () => {
  it("adds a delayed, tenant-tagged job for the attempt", async () => {
    const queue = { add: jest.fn().mockResolvedValue({ id: "job1" }) };
    const scheduler = new ExamExpiryScheduler(queue as any);
    const expiresAt = new Date(Date.now() + 70 * 60_000);

    await scheduler.scheduleAttemptExpiry({
      tenantId: "t1",
      examId: "e1",
      attemptId: "a1",
      studentId: "s1",
      expiresAt,
    });

    expect(queue.add).toHaveBeenCalledTimes(1);
    const [name, data, options] = queue.add.mock.calls[0];
    expect(name).toBe("expire-attempt");
    expect(data).toEqual({
      tenantId: "t1",
      examId: "e1",
      attemptId: "a1",
      studentId: "s1",
    });
    expect(options).toEqual(
      expect.objectContaining({
        jobId: "a1",
        attempts: 3,
        removeOnComplete: true,
      }),
    );
    expect(options.delay).toBeGreaterThan(70 * 60_000);
  });

  it("does not fail exam start when Redis is unavailable", async () => {
    const queue = {
      add: jest.fn().mockRejectedValue(new Error("redis unavailable")),
    };
    const scheduler = new ExamExpiryScheduler(queue as any);

    await expect(
      scheduler.scheduleAttemptExpiry({
        tenantId: "t1",
        examId: "e1",
        attemptId: "a1",
        studentId: "s1",
        expiresAt: new Date(Date.now() + 60_000),
      }),
    ).resolves.toBeUndefined();
  });
});
