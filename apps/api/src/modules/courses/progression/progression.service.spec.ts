import { NotFoundException } from "@nestjs/common";
import { ProgressionService } from "./progression.service";

describe("ProgressionService", () => {
  let service: ProgressionService;
  let prisma: any;
  let idempotencyService: any;
  let auditService: any;

  const tenantId = "tenant1";
  const userId = "user1";

  beforeEach(() => {
    prisma = {
      lesson: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
      },
      assignment: { findFirst: jest.fn() },
      exam: { findFirst: jest.fn() },
      enrollment: { findFirst: jest.fn() },
      studentLessonUnlock: {
        createMany: jest.fn(),
        findMany: jest.fn(),
        deleteMany: jest.fn(),
      },
      $executeRawUnsafe: jest.fn().mockResolvedValue(1),
      $transaction: jest.fn(),
    };
    // Interactive transactions: run the callback against the same mock so
    // every tx.* call is visible on the object asserted below.
    prisma.$transaction.mockImplementation((cb: any) => cb(prisma));

    idempotencyService = {
      checkAndStore: jest
        .fn()
        .mockResolvedValue({ isNew: true, existingId: "k1" }),
      markCompleted: jest.fn().mockResolvedValue(undefined),
      markFailed: jest.fn().mockResolvedValue(undefined),
      getStatus: jest.fn().mockResolvedValue(null),
    };
    auditService = { log: jest.fn().mockResolvedValue(undefined) };

    service = new ProgressionService(prisma, idempotencyService, auditService);
  });

  describe("handleEnterAssignment", () => {
    it("returns cached response on idempotent repeat", async () => {
      const cached = { unlocked: 0, lessonIds: [] };
      idempotencyService.checkAndStore.mockResolvedValue({
        isNew: false,
        response: cached,
      });

      const result = await service.handleEnterAssignment(
        tenantId,
        userId,
        "a1",
        "l1",
        "key1",
      );
      expect(result).toEqual(cached);
      expect(prisma.lesson.findMany).not.toHaveBeenCalled();
    });

    it("returns 0 unlocks when no lessons configured", async () => {
      prisma.lesson.findMany.mockResolvedValue([]);
      const result = await service.handleEnterAssignment(
        tenantId,
        userId,
        "a1",
        "l1",
        "key1",
      );
      expect(result).toEqual({ unlocked: 0, lessonIds: [] });
      expect(prisma.studentLessonUnlock.createMany).not.toHaveBeenCalled();
      expect(idempotencyService.markCompleted).toHaveBeenCalled();
    });

    it("creates a per-student unlock row and writes audit log when enrolled", async () => {
      prisma.lesson.findMany.mockResolvedValue([
        { id: "lessonExam", section: { courseId: "c1" } },
      ]);
      prisma.enrollment.findFirst.mockResolvedValue({ id: "e1" });
      prisma.studentLessonUnlock.createMany.mockResolvedValue({ count: 1 });

      const result = await service.handleEnterAssignment(
        tenantId,
        userId,
        "a1",
        "l1",
        "key1",
      );

      expect(prisma.studentLessonUnlock.createMany).toHaveBeenCalledWith({
        data: [
          {
            tenantId,
            userId,
            lessonId: "lessonExam",
            unlockType: "ENTER_ASSIGNMENT",
            sourceId: "a1",
          },
        ],
        skipDuplicates: true,
      });
      expect(result.unlocked).toBe(1);
      expect(result.lessonIds).toEqual(["lessonExam"]);
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "CONTENT_UNLOCKED",
          resourceId: "lessonExam",
        }),
      );
      // The regression that mattered: no tenant-wide flip of the lesson row.
      expect(prisma.lesson.update).not.toHaveBeenCalled();
      expect(idempotencyService.markCompleted).toHaveBeenCalled();
    });

    it("skips unlock when student not enrolled", async () => {
      prisma.lesson.findMany.mockResolvedValue([
        { id: "lessonExam", section: { courseId: "c1" } },
      ]);
      prisma.enrollment.findFirst.mockResolvedValue(null);

      const result = await service.handleEnterAssignment(
        tenantId,
        userId,
        "a1",
        "l1",
        "key1",
      );

      expect(prisma.studentLessonUnlock.createMany).not.toHaveBeenCalled();
      expect(result.unlocked).toBe(0);
      expect(auditService.log).not.toHaveBeenCalled();
    });

    it("is idempotent at the DB level: a skipped duplicate is not counted or re-audited", async () => {
      prisma.lesson.findMany.mockResolvedValue([
        { id: "lessonExam", section: { courseId: "c1" } },
      ]);
      prisma.enrollment.findFirst.mockResolvedValue({ id: "e1" });
      // Unique (tenantId, userId, lessonId) + skipDuplicates → count 0 on replay
      prisma.studentLessonUnlock.createMany.mockResolvedValue({ count: 0 });

      const result = await service.handleEnterAssignment(
        tenantId,
        userId,
        "a1",
        "l1",
        "key2",
      );

      expect(result).toEqual({ unlocked: 0, lessonIds: [] });
      expect(auditService.log).not.toHaveBeenCalled();
      expect(idempotencyService.markCompleted).toHaveBeenCalled();
    });
  });

  describe("handleEnterExam", () => {
    it("creates a per-student unlock row for the next lesson and writes audit log", async () => {
      prisma.lesson.findMany.mockResolvedValue([
        { id: "lessonNext", section: { courseId: "c1" } },
      ]);
      prisma.enrollment.findFirst.mockResolvedValue({ id: "e1" });
      prisma.studentLessonUnlock.createMany.mockResolvedValue({ count: 1 });

      const result = await service.handleEnterExam(
        tenantId,
        userId,
        "exam1",
        "l1",
        "key1",
      );

      expect(prisma.studentLessonUnlock.createMany).toHaveBeenCalledWith({
        data: [
          {
            tenantId,
            userId,
            lessonId: "lessonNext",
            unlockType: "ENTER_EXAM",
            sourceId: "exam1",
          },
        ],
        skipDuplicates: true,
      });
      expect(result.unlocked).toBe(1);
      expect(prisma.lesson.update).not.toHaveBeenCalled();
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "CONTENT_UNLOCKED",
          resourceId: "lessonNext",
        }),
      );
    });

    it("skips unlock when student not enrolled", async () => {
      prisma.lesson.findMany.mockResolvedValue([
        { id: "lessonNext", section: { courseId: "c1" } },
      ]);
      prisma.enrollment.findFirst.mockResolvedValue(null);

      const result = await service.handleEnterExam(
        tenantId,
        userId,
        "e1",
        "l1",
        "key1",
      );

      expect(prisma.studentLessonUnlock.createMany).not.toHaveBeenCalled();
      expect(result.unlocked).toBe(0);
    });
  });

  describe("getStudentProgression", () => {
    it("throws NotFoundException when not enrolled", async () => {
      prisma.enrollment.findFirst.mockResolvedValue(null);
      await expect(
        service.getStudentProgression(tenantId, userId, "c1"),
      ).rejects.toThrow(NotFoundException);
    });

    it("overlays the per-student grant on the authored lock state", async () => {
      prisma.enrollment.findFirst.mockResolvedValue({ id: "e1" });
      prisma.lesson.findMany.mockResolvedValue([
        {
          id: "l1",
          title: "Exam lesson",
          type: "VIDEO",
          orderIndex: 1,
          lockStatus: "LOCKED",
          unlockType: "ENTER_ASSIGNMENT",
          unlockTargetId: "a1",
        },
        {
          id: "l2",
          title: "Open lesson",
          type: "VIDEO",
          orderIndex: 2,
          lockStatus: "UNLOCKED",
          unlockType: "NONE",
          unlockTargetId: null,
        },
      ]);
      prisma.studentLessonUnlock.findMany.mockResolvedValue([
        {
          lessonId: "l1",
          unlockType: "ENTER_ASSIGNMENT",
          sourceId: "a1",
          unlockedAt: new Date("2026-10-17T00:00:00Z"),
        },
      ]);

      const result = await service.getStudentProgression(
        tenantId,
        userId,
        "c1",
      );

      expect(result.progression).toHaveLength(2);
      const [first, second] = result.progression;
      expect(first.lockStatus).toBe("UNLOCKED");
      expect(first.isLocked).toBe(false);
      expect(first.unlockInfo).toEqual(
        expect.objectContaining({
          unlockType: "ENTER_ASSIGNMENT",
          unlockTargetId: "a1",
        }),
      );
      // Authored UNLOCKED (teacher-wide state) still applies without a grant
      expect(second.lockStatus).toBe("UNLOCKED");
      expect(second.isUnlocked).toBe(true);
    });

    it("keeps authored LOCKED + unlock hint when no grant exists", async () => {
      prisma.enrollment.findFirst.mockResolvedValue({ id: "e1" });
      prisma.lesson.findMany.mockResolvedValue([
        {
          id: "l1",
          title: "Exam lesson",
          type: "VIDEO",
          orderIndex: 1,
          lockStatus: "LOCKED",
          unlockType: "ENTER_ASSIGNMENT",
          unlockTargetId: "a1",
        },
      ]);
      prisma.studentLessonUnlock.findMany.mockResolvedValue([]);

      const result = await service.getStudentProgression(
        tenantId,
        userId,
        "c1",
      );

      expect(result.progression[0].lockStatus).toBe("LOCKED");
      expect(result.progression[0].isLocked).toBe(true);
      expect(result.progression[0].unlockInfo).toEqual(
        expect.objectContaining({ unlockTargetId: "a1" }),
      );
    });
  });

  describe("getNextLesson", () => {
    it("throws NotFoundException when current lesson not found", async () => {
      prisma.lesson.findFirst.mockResolvedValue(null);
      await expect(service.getNextLesson(tenantId, "l1")).rejects.toThrow(
        NotFoundException,
      );
    });

    it("looks the current lesson up scoped to the tenant (audit §6.1)", async () => {
      prisma.lesson.findFirst
        .mockResolvedValueOnce({
          id: "l1",
          sectionId: "sec1",
          orderIndex: 2,
          section: {},
        })
        .mockResolvedValueOnce({ id: "l3", orderIndex: 3 });

      const result = await service.getNextLesson(tenantId, "l1");

      expect(prisma.lesson.findFirst).toHaveBeenNthCalledWith(1, {
        where: { id: "l1", tenantId },
        include: { section: true },
      });
      expect(prisma.lesson.findFirst).toHaveBeenNthCalledWith(2, {
        where: { tenantId, sectionId: "sec1", orderIndex: { gt: 2 } },
        orderBy: { orderIndex: "asc" },
      });
      expect(result.id).toBe("l3");
    });
  });

  describe("manuallyUnlockLesson", () => {
    it("unlocks lesson and writes audit log", async () => {
      prisma.lesson.findFirst.mockResolvedValue({ id: "l1" });
      prisma.lesson.update.mockResolvedValue({
        id: "l1",
        lockStatus: "UNLOCKED",
      });

      const result = await service.manuallyUnlockLesson(
        tenantId,
        userId,
        "l1",
        "teacher override",
      );

      expect(result.lockStatus).toBe("UNLOCKED");
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "CONTENT_MANUALLY_UNLOCKED",
          metadata: { reason: "teacher override" },
        }),
      );
    });
  });

  describe("resetLessonLock", () => {
    it("revokes per-student unlocks and resets lock status", async () => {
      prisma.lesson.findFirst.mockResolvedValue({ id: "l1" });
      prisma.studentLessonUnlock.deleteMany.mockResolvedValue({ count: 2 });
      prisma.lesson.update.mockResolvedValue({
        id: "l1",
        lockStatus: "LOCKED",
      });

      const result = await service.resetLessonLock(tenantId, userId, "l1");

      expect(prisma.studentLessonUnlock.deleteMany).toHaveBeenCalledWith({
        where: { tenantId, lessonId: "l1" },
      });
      expect(prisma.lesson.update).toHaveBeenCalledWith({
        where: { id: "l1" },
        data: {
          lockStatus: "LOCKED",
          unlockType: "NONE",
          unlockTargetId: null,
        },
      });
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: "CONTENT_LOCK_RESET" }),
      );
      expect(result.lockStatus).toBe("LOCKED");
    });
  });
});
