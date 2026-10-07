import { Test, TestingModule } from "@nestjs/testing";
import {
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from "@nestjs/common";
import { ExamsService } from "./exams.service";
import { PrismaService } from "../../tenants/prisma.service";
import { IdempotencyService } from "../../payments/security/idempotency.service";
import { ProgressionService } from "../progression/progression.service";

describe("ExamsService", () => {
  let service: ExamsService;
  let prisma: any;
  let idempotencyService: any;
  let progressionService: any;

  const tenantId = "tenant1";
  const userId = "user1";

  beforeEach(() => {
    prisma = {
      lesson: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      exam: {
        create: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
      },
      examAttempt: {
        count: jest.fn(),
        create: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
      },
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
    progressionService = {
      handleEnterExam: jest.fn().mockResolvedValue({ unlocked: 1 }),
    };

    service = new ExamsService(prisma, idempotencyService, progressionService);
  });

  describe("createExam", () => {
    it("throws NotFoundException if lesson does not exist", async () => {
      prisma.lesson.findFirst.mockResolvedValue(null);
      await expect(
        service.createExam(tenantId, userId, "l1", {}),
      ).rejects.toThrow(NotFoundException);
    });

    it("throws ConflictException if lesson already has exam", async () => {
      prisma.lesson.findFirst.mockResolvedValue({
        id: "l1",
        type: "EXAM",
        exam: { id: "e1" },
      });
      await expect(
        service.createExam(tenantId, userId, "l1", {}),
      ).rejects.toThrow(ConflictException);
    });

    it("throws BadRequestException if lesson type is not EXAM", async () => {
      prisma.lesson.findFirst.mockResolvedValue({
        id: "l1",
        type: "VIDEO",
        exam: null,
      });
      await expect(
        service.createExam(tenantId, userId, "l1", {}),
      ).rejects.toThrow(BadRequestException);
    });

    it("creates exam with default 70-minute timer", async () => {
      prisma.lesson.findFirst.mockResolvedValue({
        id: "l1",
        type: "EXAM",
        exam: null,
      });
      prisma.exam.create.mockResolvedValue({ id: "e1", timerMinutes: 70 });
      prisma.lesson.update.mockResolvedValue({});

      const result = await service.createExam(tenantId, userId, "l1", {
        title: "Final",
      });

      expect(prisma.exam.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ timerMinutes: 70 }),
        }),
      );
      expect(prisma.lesson.update).toHaveBeenCalledWith({
        where: { id: "l1" },
        data: { examId: "e1" },
      });
      expect(result.timerMinutes).toBe(70);
    });
  });

  describe("startExamAttempt", () => {
    it("returns cached response on idempotent repeat", async () => {
      const cached = { attemptId: "at1", status: "IN_PROGRESS" };
      idempotencyService.checkAndStore.mockResolvedValue({
        isNew: false,
        response: cached,
      });

      const result = await service.startExamAttempt(
        tenantId,
        userId,
        "e1",
        "key1",
      );
      expect(result).toEqual(cached);
      expect(prisma.exam.findFirst).not.toHaveBeenCalled();
    });

    it("throws BadRequestException when exam is not published", async () => {
      prisma.exam.findFirst.mockResolvedValue({
        id: "e1",
        status: "DRAFT",
        questions: [],
      });
      await expect(
        service.startExamAttempt(tenantId, userId, "e1", "key1"),
      ).rejects.toThrow(BadRequestException);
    });

    it("throws ForbiddenException when not enrolled", async () => {
      prisma.exam.findFirst.mockResolvedValue({
        id: "e1",
        status: "PUBLISHED",
        lessonId: "l1",
        timerMinutes: 70,
        questions: [],
      });
      prisma.lesson.findUnique.mockResolvedValue({
        id: "l1",
        section: { courseId: "c1" },
      });
      prisma.enrollment.findFirst.mockResolvedValue(null);

      await expect(
        service.startExamAttempt(tenantId, userId, "e1", "key1"),
      ).rejects.toThrow(ForbiddenException);
    });

    it("throws ConflictException when active attempt exists", async () => {
      prisma.exam.findFirst.mockResolvedValue({
        id: "e1",
        status: "PUBLISHED",
        lessonId: "l1",
        timerMinutes: 70,
        questions: [],
        maxAttempts: 3,
      });
      prisma.lesson.findUnique.mockResolvedValue({
        id: "l1",
        section: { courseId: "c1" },
      });
      prisma.enrollment.findFirst.mockResolvedValue({ id: "en1" });
      prisma.examAttempt.count.mockResolvedValue(0);
      prisma.examAttempt.findFirst.mockResolvedValue({ id: "at1" });

      await expect(
        service.startExamAttempt(tenantId, userId, "e1", "key1"),
      ).rejects.toThrow(ConflictException);
    });

    it("creates attempt with server-authoritative timer and triggers progression", async () => {
      const questions = [
        {
          id: "q1",
          type: "MCQ",
          text: "Q?",
          points: 10,
          position: 1,
          options: [{ id: "o1", text: "A" }],
        },
      ];
      prisma.exam.findFirst.mockResolvedValue({
        id: "e1",
        status: "PUBLISHED",
        lessonId: "l1",
        timerMinutes: 70,
        questions,
        maxAttempts: 3,
        shuffleQuestions: false,
        shuffleOptions: false,
      });
      prisma.lesson.findUnique.mockResolvedValue({
        id: "l1",
        section: { courseId: "c1" },
      });
      prisma.enrollment.findFirst.mockResolvedValue({ id: "en1" });
      prisma.examAttempt.count.mockResolvedValue(0);
      prisma.examAttempt.findFirst.mockResolvedValue(null);
      prisma.examAttempt.create.mockResolvedValue({ id: "at1" });

      const result = await service.startExamAttempt(
        tenantId,
        userId,
        "e1",
        "key1",
      );

      const expected = result.startedAt.getTime() + 70 * 60 * 1000;
      expect(Math.abs(result.expiresAt.getTime() - expected)).toBeLessThan(
        1000,
      );
      expect(result.timeRemainingSeconds).toBe(70 * 60);
      expect(result.questions[0]).not.toHaveProperty("correctAnswer");

      expect(progressionService.handleEnterExam).toHaveBeenCalledWith(
        tenantId,
        userId,
        "e1",
        "l1",
        "key1:progression",
      );
      expect(idempotencyService.markCompleted).toHaveBeenCalled();
    });
  });

  describe("submitExamAttempt", () => {
    it("throws NotFoundException when no active attempt", async () => {
      prisma.examAttempt.findFirst.mockResolvedValue(null);
      await expect(
        service.submitExamAttempt(tenantId, userId, "e1", {
          answers: {},
          idempotencyKey: "k1",
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it("marks TIMED_OUT when timer expired", async () => {
      const oldDate = new Date(Date.now() - 80 * 60 * 1000);
      prisma.examAttempt.findFirst.mockResolvedValue({
        id: "at1",
        startedAt: oldDate,
        exam: { timerMinutes: 70 },
      });
      prisma.examAttempt.update.mockResolvedValue({
        id: "at1",
        status: "TIMED_OUT",
        submittedAt: new Date(),
      });

      const result = await service.submitExamAttempt(tenantId, userId, "e1", {
        answers: {},
        idempotencyKey: "k1",
      });

      expect(prisma.examAttempt.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: "TIMED_OUT" }),
        }),
      );
      expect(result.isTimedOut).toBe(true);
    });

    it("marks SUBMITTED when within timer", async () => {
      prisma.examAttempt.findFirst.mockResolvedValue({
        id: "at1",
        startedAt: new Date(),
        exam: { timerMinutes: 70 },
      });
      prisma.examAttempt.update.mockResolvedValue({
        id: "at1",
        status: "SUBMITTED",
        submittedAt: new Date(),
      });

      const result = await service.submitExamAttempt(tenantId, userId, "e1", {
        answers: {},
        idempotencyKey: "k1",
      });

      expect(prisma.examAttempt.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: "SUBMITTED" }),
        }),
      );
      expect(result.isTimedOut).toBe(false);
    });
  });

  describe("gradeExamAttempt", () => {
    it("throws ConflictException when already graded", async () => {
      prisma.examAttempt.findFirst.mockResolvedValue({
        id: "at1",
        status: "GRADED",
      });
      await expect(
        service.gradeExamAttempt(tenantId, "at1", "t1", { score: 80 }),
      ).rejects.toThrow(ConflictException);
    });

    it("computes passed from passingScore", async () => {
      prisma.examAttempt.findFirst.mockResolvedValue({
        id: "at1",
        status: "SUBMITTED",
        exam: { passingScore: 60 },
      });
      prisma.examAttempt.update.mockResolvedValue({
        id: "at1",
        status: "GRADED",
      });

      await service.gradeExamAttempt(tenantId, "at1", "t1", { score: 75 });

      expect(prisma.examAttempt.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ passed: true }),
        }),
      );
    });
  });

  describe("publishExam", () => {
    it("is idempotent when already published", async () => {
      prisma.exam.findFirst.mockResolvedValue({
        id: "e1",
        status: "PUBLISHED",
      });
      const result = await service.publishExam(tenantId, "e1");
      expect(result.status).toBe("PUBLISHED");
      expect(prisma.exam.update).not.toHaveBeenCalled();
    });
  });
});
