import { Test, TestingModule } from "@nestjs/testing";
import { NotFoundException } from "@nestjs/common";
import { ProgressionService } from "./progression.service";
import { PrismaService } from "../../tenants/prisma.service";
import { IdempotencyService } from "../../payments/security/idempotency.service";
import { AuditService } from "../../audit/audit.service";

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
    };
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
      expect(result.unlocked).toBe(0);
      expect(idempotencyService.markCompleted).toHaveBeenCalled();
    });

    it("unlocks exam-lesson and writes audit log when enrolled", async () => {
      prisma.lesson.findMany.mockResolvedValue([
        { id: "lessonExam", section: { courseId: "c1" } },
      ]);
      prisma.enrollment.findFirst.mockResolvedValue({ id: "e1" });
      prisma.lesson.update.mockResolvedValue({});

      const result = await service.handleEnterAssignment(
        tenantId,
        userId,
        "a1",
        "l1",
        "key1",
      );

      expect(prisma.lesson.update).toHaveBeenCalledWith({
        where: { id: "lessonExam" },
        data: { lockStatus: "UNLOCKED" },
      });
      expect(result.unlocked).toBe(1);
      expect(result.lessonIds).toEqual(["lessonExam"]);
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "CONTENT_UNLOCKED",
          resourceId: "lessonExam",
        }),
      );
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

      expect(prisma.lesson.update).not.toHaveBeenCalled();
      expect(result.unlocked).toBe(0);
      expect(auditService.log).not.toHaveBeenCalled();
    });
  });

  describe("handleEnterExam", () => {
    it("unlocks next lesson and writes audit log when enrolled", async () => {
      prisma.lesson.findMany.mockResolvedValue([
        { id: "lessonNext", section: { courseId: "c1" } },
      ]);
      prisma.enrollment.findFirst.mockResolvedValue({ id: "e1" });
      prisma.lesson.update.mockResolvedValue({});

      const result = await service.handleEnterExam(
        tenantId,
        userId,
        "e1",
        "l1",
        "key1",
      );

      expect(prisma.lesson.update).toHaveBeenCalledWith({
        where: { id: "lessonNext" },
        data: { lockStatus: "UNLOCKED" },
      });
      expect(result.unlocked).toBe(1);
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

      expect(prisma.lesson.update).not.toHaveBeenCalled();
      expect(result.unlocked).toBe(0);
    });
  });

  describe("getNextLesson", () => {
    it("throws NotFoundException when current lesson not found", async () => {
      prisma.lesson.findUnique.mockResolvedValue(null);
      await expect(service.getNextLesson(tenantId, "l1")).rejects.toThrow(
        NotFoundException,
      );
    });

    it("returns the lesson with next orderIndex in same section", async () => {
      prisma.lesson.findUnique.mockResolvedValue({
        id: "l1",
        sectionId: "sec1",
        orderIndex: 2,
        section: {},
      });
      prisma.lesson.findFirst.mockResolvedValue({ id: "l3", orderIndex: 3 });

      const result = await service.getNextLesson(tenantId, "l1");

      expect(prisma.lesson.findFirst).toHaveBeenCalledWith({
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
    it("resets lock status and clears unlock config", async () => {
      prisma.lesson.findFirst.mockResolvedValue({ id: "l1" });
      prisma.lesson.update.mockResolvedValue({
        id: "l1",
        lockStatus: "LOCKED",
      });

      const result = await service.resetLessonLock(tenantId, userId, "l1");

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
