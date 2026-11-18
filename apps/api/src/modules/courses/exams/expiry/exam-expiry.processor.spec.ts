import { ExamExpiryProcessor } from "./exam-expiry.processor";

function jobFor(attemptId = "a1") {
  return {
    data: {
      tenantId: "t1",
      examId: "e1",
      attemptId,
      studentId: "s1",
    },
  } as any;
}

describe("ExamExpiryProcessor", () => {
  let prisma: any;
  let processor: ExamExpiryProcessor;

  beforeEach(() => {
    prisma = {
      examAttempt: {
        findFirst: jest.fn(),
        updateMany: jest.fn(),
      },
    };
    processor = new ExamExpiryProcessor(prisma);
  });

  it("marks an expired, still-active attempt TIMED_OUT", async () => {
    prisma.examAttempt.findFirst.mockResolvedValue({
      id: "a1",
      status: "IN_PROGRESS",
      startedAt: new Date(Date.now() - 80 * 60_000),
      exam: { timerMinutes: 70 },
    });
    prisma.examAttempt.updateMany.mockResolvedValue({ count: 1 });

    const result = await processor.expireAttempt(jobFor());

    expect(result).toEqual({
      status: "expired",
      attemptId: "a1",
      examId: "e1",
    });
    expect(prisma.examAttempt.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "a1", tenantId: "t1", examId: "e1" },
      }),
    );
    expect(prisma.examAttempt.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: "a1",
          tenantId: "t1",
          status: "IN_PROGRESS",
        }),
        data: expect.objectContaining({
          status: "TIMED_OUT",
          timeRemainingSeconds: 0,
        }),
      }),
    );
  });

  it("ignores attempts that are no longer active", async () => {
    prisma.examAttempt.findFirst.mockResolvedValue({
      id: "a1",
      status: "SUBMITTED",
      startedAt: new Date(Date.now() - 80 * 60_000),
      exam: { timerMinutes: 70 },
    });

    const result = await processor.expireAttempt(jobFor());

    expect(result).toEqual({ status: "skipped", reason: "not-active" });
    expect(prisma.examAttempt.updateMany).not.toHaveBeenCalled();
  });

  it("retries instead of closing an attempt before its deadline", async () => {
    prisma.examAttempt.findFirst.mockResolvedValue({
      id: "a1",
      status: "IN_PROGRESS",
      startedAt: new Date(),
      exam: { timerMinutes: 70 },
    });

    await expect(processor.expireAttempt(jobFor())).rejects.toThrow(
      "attempt-not-yet-expired",
    );
    expect(prisma.examAttempt.updateMany).not.toHaveBeenCalled();
  });

  it("reports a race when another request closed the attempt first", async () => {
    prisma.examAttempt.findFirst.mockResolvedValue({
      id: "a1",
      status: "IN_PROGRESS",
      startedAt: new Date(Date.now() - 80 * 60_000),
      exam: { timerMinutes: 70 },
    });
    prisma.examAttempt.updateMany.mockResolvedValue({ count: 0 });

    const result = await processor.expireAttempt(jobFor());

    expect(result).toEqual({ status: "skipped", reason: "race" });
  });
});
