import { Test, TestingModule } from "@nestjs/testing";
import {
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from "@nestjs/common";
import { AssignmentsService } from "./assignments.service";
import { SanadClient } from "./sanad.client";
import { PrismaService } from "../../tenants/prisma.service";
import { IdempotencyService } from "../../payments/security/idempotency.service";
import { ProgressionService } from "../progression/progression.service";

describe("AssignmentsService", () => {
  let service: AssignmentsService;
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
      assignment: {
        create: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
      },
      assignmentSubmission: {
        count: jest.fn(),
        create: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
      },
      enrollment: { findFirst: jest.fn() },
      studentLessonUnlock: { findFirst: jest.fn() },
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
      handleEnterAssignment: jest
        .fn()
        .mockResolvedValue({ unlocked: 1, lessonIds: ["lessonExam"] }),
    };

    service = new AssignmentsService(
      prisma,
      idempotencyService,
      progressionService,
    );
  });

  describe("createAssignment", () => {
    it("throws NotFoundException if lesson does not exist", async () => {
      prisma.lesson.findFirst.mockResolvedValue(null);
      await expect(
        service.createAssignment(tenantId, userId, "l1", { title: "x" }),
      ).rejects.toThrow(NotFoundException);
    });

    it("throws ConflictException if lesson already has assignment", async () => {
      prisma.lesson.findFirst.mockResolvedValue({
        id: "l1",
        type: "ASSIGNMENT",
        assignment: { id: "a1" },
      });
      await expect(
        service.createAssignment(tenantId, userId, "l1", {}),
      ).rejects.toThrow(ConflictException);
    });

    it("throws BadRequestException if lesson type is not ASSIGNMENT", async () => {
      prisma.lesson.findFirst.mockResolvedValue({
        id: "l1",
        type: "VIDEO",
        assignment: null,
      });
      await expect(
        service.createAssignment(tenantId, userId, "l1", {}),
      ).rejects.toThrow(BadRequestException);
    });

    it("creates assignment with default 300-minute timer", async () => {
      prisma.lesson.findFirst.mockResolvedValue({
        id: "l1",
        type: "ASSIGNMENT",
        assignment: null,
      });
      prisma.assignment.create.mockResolvedValue({
        id: "a1",
        timerMinutes: 300,
      });
      prisma.lesson.update.mockResolvedValue({});

      const result = await service.createAssignment(tenantId, userId, "l1", {
        title: "HW",
      });

      expect(prisma.assignment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ timerMinutes: 300 }),
        }),
      );
      expect(prisma.lesson.update).toHaveBeenCalledWith({
        where: { id: "l1" },
        data: { assignmentId: "a1" },
      });
      expect(result.timerMinutes).toBe(300);
    });
  });

  describe("startAssignmentAttempt", () => {
    it("returns cached response on idempotent repeat", async () => {
      const cached = { attemptId: "s1", status: "SUBMITTED" };
      idempotencyService.checkAndStore.mockResolvedValue({
        isNew: false,
        response: cached,
      });

      const result = await service.startAssignmentAttempt(
        tenantId,
        userId,
        "a1",
        "key1",
      );
      expect(result).toEqual(cached);
      expect(prisma.assignment.findFirst).not.toHaveBeenCalled();
      expect(progressionService.handleEnterAssignment).not.toHaveBeenCalled();
    });

    it("throws BadRequestException when assignment is not published", async () => {
      prisma.assignment.findFirst.mockResolvedValue({
        id: "a1",
        status: "DRAFT",
      });
      await expect(
        service.startAssignmentAttempt(tenantId, userId, "a1", "key1"),
      ).rejects.toThrow(BadRequestException);
    });

    it("throws ForbiddenException when not enrolled", async () => {
      prisma.assignment.findFirst.mockResolvedValue({
        id: "a1",
        status: "PUBLISHED",
        lessonId: "l1",
        timerMinutes: 300,
      });
      prisma.lesson.findUnique.mockResolvedValue({
        id: "l1",
        section: { courseId: "c1" },
      });
      prisma.enrollment.findFirst.mockResolvedValue(null);

      await expect(
        service.startAssignmentAttempt(tenantId, userId, "a1", "key1"),
      ).rejects.toThrow(ForbiddenException);
    });

    it("rejects a locked assignment without a per-student grant", async () => {
      prisma.assignment.findFirst.mockResolvedValue({
        id: "a1",
        status: "PUBLISHED",
        lessonId: "l1",
        timerMinutes: 300,
        maxAttempts: 3,
      });
      prisma.lesson.findUnique.mockResolvedValue({
        id: "l1",
        lockStatus: "LOCKED",
        section: { courseId: "c1" },
      });
      prisma.enrollment.findFirst.mockResolvedValue({ id: "e1" });
      prisma.studentLessonUnlock.findFirst.mockResolvedValue(null);

      await expect(
        service.startAssignmentAttempt(tenantId, userId, "a1", "key1"),
      ).rejects.toThrow(ForbiddenException);
    });

    it("throws BadRequestException when max attempts reached", async () => {
      prisma.assignment.findFirst.mockResolvedValue({
        id: "a1",
        status: "PUBLISHED",
        lessonId: "l1",
        timerMinutes: 300,
        maxAttempts: 1,
      });
      prisma.lesson.findUnique.mockResolvedValue({
        id: "l1",
        section: { courseId: "c1" },
      });
      prisma.enrollment.findFirst.mockResolvedValue({ id: "e1" });
      prisma.assignmentSubmission.count.mockResolvedValue(1);

      await expect(
        service.startAssignmentAttempt(tenantId, userId, "a1", "key1"),
      ).rejects.toThrow(BadRequestException);
    });

    it("throws ConflictException when active attempt exists", async () => {
      prisma.assignment.findFirst.mockResolvedValue({
        id: "a1",
        status: "PUBLISHED",
        lessonId: "l1",
        timerMinutes: 300,
        maxAttempts: 3,
      });
      prisma.lesson.findUnique.mockResolvedValue({
        id: "l1",
        section: { courseId: "c1" },
      });
      prisma.enrollment.findFirst.mockResolvedValue({ id: "e1" });
      prisma.assignmentSubmission.count.mockResolvedValue(0);
      prisma.assignmentSubmission.findFirst.mockResolvedValue({ id: "s1" });

      await expect(
        service.startAssignmentAttempt(tenantId, userId, "a1", "key1"),
      ).rejects.toThrow(ConflictException);
    });

    it("creates submission with server-authoritative timer and triggers progression", async () => {
      prisma.assignment.findFirst.mockResolvedValue({
        id: "a1",
        status: "PUBLISHED",
        lessonId: "l1",
        timerMinutes: 300,
        maxAttempts: 3,
      });
      prisma.lesson.findUnique.mockResolvedValue({
        id: "l1",
        section: { courseId: "c1" },
      });
      prisma.enrollment.findFirst.mockResolvedValue({ id: "e1" });
      prisma.assignmentSubmission.count.mockResolvedValue(0);
      prisma.assignmentSubmission.findFirst.mockResolvedValue(null);
      prisma.assignmentSubmission.create.mockResolvedValue({
        id: "s1",
        attemptNumber: 1,
      });

      const before = Date.now();
      const result = await service.startAssignmentAttempt(
        tenantId,
        userId,
        "a1",
        "key1",
      );
      const after = Date.now();

      // expiresAt = startedAt + 300 minutes
      const expected = result.startedAt.getTime() + 300 * 60 * 1000;
      expect(Math.abs(result.expiresAt.getTime() - expected)).toBeLessThan(
        1000,
      );
      expect(result.timeRemainingSeconds).toBe(300 * 60);
      expect(result.attemptNumber).toBe(1);
      expect(prisma.assignmentSubmission.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          status: "IN_PROGRESS",
          attemptNumber: 1,
          startedAt: expect.any(Date),
          submittedAt: null,
        }),
      });

      expect(progressionService.handleEnterAssignment).toHaveBeenCalledWith(
        tenantId,
        userId,
        "a1",
        "l1",
        "key1:progression",
      );
      // Single progression call: the unlock result travels inside the SAME
      // idempotent response (audit 2026-10-16 §6.1 — the controller used to
      // call progression a second time and always reported 0 unlocks).
      expect(result.unlocked).toEqual({
        unlocked: 1,
        lessonIds: ["lessonExam"],
      });
      // Unlocks are computed BEFORE the response is cached
      expect(
        progressionService.handleEnterAssignment.mock.invocationCallOrder[0],
      ).toBeLessThan(
        idempotencyService.markCompleted.mock.invocationCallOrder[0],
      );
      expect(idempotencyService.markCompleted).toHaveBeenCalled();
      expect(result.startedAt.getTime()).toBeGreaterThanOrEqual(before);
      expect(result.startedAt.getTime()).toBeLessThanOrEqual(after);
    });

    it("starts attempt #2 after a completed attempt when retakes remain", async () => {
      prisma.assignment.findFirst.mockResolvedValue({
        id: "a1",
        status: "PUBLISHED",
        lessonId: "l1",
        timerMinutes: 300,
        maxAttempts: 3,
      });
      prisma.lesson.findUnique.mockResolvedValue({
        id: "l1",
        section: { courseId: "c1" },
      });
      prisma.enrollment.findFirst.mockResolvedValue({ id: "e1" });
      prisma.assignmentSubmission.count.mockResolvedValue(1);
      prisma.assignmentSubmission.findFirst.mockResolvedValue(null);
      prisma.assignmentSubmission.create.mockResolvedValue({
        id: "s2",
        attemptNumber: 2,
      });

      const result = await service.startAssignmentAttempt(
        tenantId,
        userId,
        "a1",
        "key2",
      );

      expect(result.attemptNumber).toBe(2);
      expect(prisma.assignmentSubmission.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          status: "IN_PROGRESS",
          attemptNumber: 2,
          submittedAt: null,
        }),
      });
    });

    it("turns a concurrent duplicate insert into a conflict", async () => {
      prisma.assignment.findFirst.mockResolvedValue({
        id: "a1",
        status: "PUBLISHED",
        lessonId: "l1",
        timerMinutes: 300,
        maxAttempts: 3,
      });
      prisma.lesson.findUnique.mockResolvedValue({
        id: "l1",
        section: { courseId: "c1" },
      });
      prisma.enrollment.findFirst.mockResolvedValue({ id: "e1" });
      prisma.assignmentSubmission.count.mockResolvedValue(0);
      prisma.assignmentSubmission.findFirst.mockResolvedValue(null);
      prisma.assignmentSubmission.create.mockRejectedValue({ code: "P2002" });

      await expect(
        service.startAssignmentAttempt(tenantId, userId, "a1", "key1"),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe("submitAssignment", () => {
    it("throws NotFoundException when no active attempt", async () => {
      prisma.assignmentSubmission.findFirst.mockResolvedValue(null);
      await expect(
        service.submitAssignment(tenantId, userId, "a1", {
          idempotencyKey: "k1",
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it("marks REJECTED when timer expired and late not allowed", async () => {
      const oldDate = new Date(Date.now() - 400 * 60 * 1000);
      prisma.assignmentSubmission.findFirst.mockResolvedValue({
        id: "s1",
        status: "IN_PROGRESS",
        startedAt: oldDate,
        submittedAt: null,
        assignment: { timerMinutes: 300, allowLateSubmission: false },
      });
      prisma.assignmentSubmission.update.mockResolvedValue({
        id: "s1",
        status: "REJECTED",
        submittedAt: new Date(),
      });

      const result = await service.submitAssignment(tenantId, userId, "a1", {
        idempotencyKey: "k1",
      });

      expect(prisma.assignmentSubmission.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: "REJECTED" }),
        }),
      );
      expect(result.message).toContain("rejected");
    });

    it("marks LATE when timer expired and late allowed", async () => {
      const oldDate = new Date(Date.now() - 400 * 60 * 1000);
      prisma.assignmentSubmission.findFirst.mockResolvedValue({
        id: "s1",
        status: "IN_PROGRESS",
        startedAt: oldDate,
        submittedAt: null,
        assignment: { timerMinutes: 300, allowLateSubmission: true },
      });
      prisma.assignmentSubmission.update.mockResolvedValue({
        id: "s1",
        status: "LATE",
        submittedAt: new Date(),
      });

      const result = await service.submitAssignment(tenantId, userId, "a1", {
        idempotencyKey: "k1",
      });

      expect(prisma.assignmentSubmission.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: "LATE" }),
        }),
      );
      expect(result.message).toContain("late");
    });

    it("marks SUBMITTED when within timer", async () => {
      prisma.assignmentSubmission.findFirst.mockResolvedValue({
        id: "s1",
        status: "IN_PROGRESS",
        startedAt: new Date(),
        submittedAt: null,
        assignment: { timerMinutes: 300, allowLateSubmission: true },
      });
      prisma.assignmentSubmission.update.mockResolvedValue({
        id: "s1",
        status: "SUBMITTED",
        submittedAt: new Date(),
      });

      const result = await service.submitAssignment(tenantId, userId, "a1", {
        idempotencyKey: "k1",
      });

      expect(prisma.assignmentSubmission.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: "SUBMITTED" }),
        }),
      );
      expect(result.message).toContain("successfully");
    });
  });

  describe("gradeSubmission", () => {
    it("throws ConflictException when already graded", async () => {
      prisma.assignmentSubmission.findFirst.mockResolvedValue({
        id: "s1",
        status: "GRADED",
      });
      await expect(
        service.gradeSubmission(tenantId, "s1", "t1", { score: 80 }),
      ).rejects.toThrow(ConflictException);
    });

    it("throws BadRequestException when score out of range", async () => {
      prisma.assignmentSubmission.findFirst.mockResolvedValue({
        id: "s1",
        status: "SUBMITTED",
      });
      await expect(
        service.gradeSubmission(tenantId, "s1", "t1", { score: 150 }),
      ).rejects.toThrow(BadRequestException);
    });

    it("refuses to grade an attempt that is still in progress", async () => {
      prisma.assignmentSubmission.findFirst.mockResolvedValue({
        id: "s1",
        status: "IN_PROGRESS",
      });
      await expect(
        service.gradeSubmission(tenantId, "s1", "t1", { score: 80 }),
      ).rejects.toThrow(ConflictException);
      expect(prisma.assignmentSubmission.update).not.toHaveBeenCalled();
    });

    it("grades successfully", async () => {
      prisma.assignmentSubmission.findFirst.mockResolvedValue({
        id: "s1",
        status: "SUBMITTED",
        assignment: { passingScore: 50 },
      });
      prisma.assignmentSubmission.update.mockResolvedValue({
        id: "s1",
        status: "GRADED",
        score: 80,
      });

      const result = await service.gradeSubmission(tenantId, "s1", "t1", {
        score: 80,
      });

      expect(result.status).toBe("GRADED");
      expect(prisma.assignmentSubmission.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: "GRADED", score: 80 }),
        }),
      );
    });
  });

  describe("publishAssignment", () => {
    it("is idempotent when already published", async () => {
      prisma.assignment.findFirst.mockResolvedValue({
        id: "a1",
        status: "PUBLISHED",
      });
      const result = await service.publishAssignment(tenantId, "a1");
      expect(result.status).toBe("PUBLISHED");
      expect(prisma.assignment.update).not.toHaveBeenCalled();
    });

    it("publishes assignment and lesson", async () => {
      prisma.assignment.findFirst.mockResolvedValue({
        id: "a1",
        status: "DRAFT",
        lessonId: "l1",
      });
      prisma.assignment.update.mockResolvedValue({
        id: "a1",
        status: "PUBLISHED",
      });
      prisma.lesson.update.mockResolvedValue({});

      await service.publishAssignment(tenantId, "a1");

      expect(prisma.assignment.update).toHaveBeenCalledWith({
        where: { id: "a1" },
        data: { status: "PUBLISHED" },
      });
      expect(prisma.lesson.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "l1" },
          data: expect.objectContaining({ status: "PUBLISHED" }),
        }),
      );
    });
  });

  describe("evaluateAssignmentWithAI", () => {
    const grading = {
      reference_answer: "ref",
      max_score: 10,
      rubric_version: "v1",
      criteria: [{ id: "c1", description: "d1", max_score: 10 }],
    };

    it("throws BadRequestException when rubric or sources are missing", async () => {
      const svc: any = new AssignmentsService(
        prisma,
        idempotencyService,
        progressionService,
        { evaluateSubmission: jest.fn() } as unknown as SanadClient,
      );
      await expect(
        svc.evaluateAssignmentWithAI(tenantId, userId, "a1", "ans"),
      ).rejects.toThrow(BadRequestException);
    });

    it("maps SANAD suggestion without setting the official grade", async () => {
      const sanadResult = {
        evaluation_id: "e1",
        request_id: "r1",
        sanad_submission_id: "s1",
        status: "COMPLETED",
        suggested_score: 7,
        max_score: 10,
        criteria: [],
        feedback_ar: "good",
        review_signal: 0.9,
        needs_teacher_review: true,
        knowledge_gaps: [],
        provenance: {},
        usage: {},
      };
      const sanad = {
        evaluateSubmission: jest.fn().mockResolvedValue(sanadResult),
      };
      const svc: any = new AssignmentsService(
        prisma,
        idempotencyService,
        progressionService,
        sanad as unknown as SanadClient,
      );
      const result = await svc.evaluateAssignmentWithAI(
        tenantId,
        userId,
        "a1",
        "ans",
        "q?",
        grading,
        ["gen_fixed_irab_v1"],
      );
      expect(sanad.evaluateSubmission).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId,
          grading,
          sourceIds: ["gen_fixed_irab_v1"],
        }),
      );
      expect(result.data.score).toBe(7);
      expect(result.data.needsTeacherReview).toBe(true);
      expect(result.data.sanadSubmissionId).toBe("s1");
      // Official grade stays untouched: no submission update here.
      expect(prisma.assignmentSubmission.update).not.toHaveBeenCalled();
    });
  });

  describe("getStudentAssignmentView", () => {
    // Security regression (leak fix 2026-10-16): the student view used to
    // spread the full assignment, including EVERY student's submissions
    // (content, score, feedback). It must query only the caller's rows.
    const assignmentRow = {
      id: "a1",
      lessonId: "l1",
      timerMinutes: 300,
      maxAttempts: 1,
      // Deliberately no `submissions` key: the view must not depend on it.
    };

    beforeEach(() => {
      prisma.assignment.findFirst.mockResolvedValue({ ...assignmentRow });
      prisma.lesson.findUnique.mockResolvedValue({
        id: "l1",
        section: { courseId: "c1" },
      });
      prisma.enrollment.findFirst.mockResolvedValue({ id: "en1" });
    });

    it("queries ONLY the calling student's submissions", async () => {
      prisma.assignmentSubmission.findMany.mockResolvedValue([]);

      const result = await service.getStudentAssignmentView(
        tenantId,
        userId,
        "a1",
      );

      expect(prisma.assignmentSubmission.findMany).toHaveBeenCalledWith({
        where: { tenantId, assignmentId: "a1", studentId: userId },
        orderBy: { attemptNumber: "desc" },
      });
      expect(result).not.toHaveProperty("submissions");
      expect(result.studentAttemptCount).toBe(0);
    });

    it("rejects a locked assignment view until the student has a grant", async () => {
      prisma.lesson.findUnique.mockResolvedValue({
        id: "l1",
        lockStatus: "LOCKED",
        section: { courseId: "c1" },
      });
      prisma.studentLessonUnlock.findFirst.mockResolvedValue(null);

      await expect(
        service.getStudentAssignmentView(tenantId, userId, "a1"),
      ).rejects.toThrow(ForbiddenException);
      expect(prisma.assignmentSubmission.findMany).not.toHaveBeenCalled();
    });

    it("never requests submissions via the assignment include", async () => {
      prisma.assignmentSubmission.findMany.mockResolvedValue([]);

      await service.getStudentAssignmentView(tenantId, userId, "a1");

      expect(prisma.assignment.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.objectContaining({ submissions: false }),
        }),
      );
    });

    it("computes remaining time from the student's own active submission", async () => {
      const startedAt = new Date();
      startedAt.setMinutes(startedAt.getMinutes() - 10);
      prisma.assignmentSubmission.findMany.mockResolvedValue([
        {
          id: "s1",
          studentId: userId,
          status: "IN_PROGRESS",
          attemptNumber: 1,
          startedAt,
          submittedAt: null,
          content: null,
          attachments: null,
        },
      ]);

      const result = await service.getStudentAssignmentView(
        tenantId,
        userId,
        "a1",
      );

      expect(result.activeSubmission).toEqual(
        expect.objectContaining({
          id: "s1",
          status: "IN_PROGRESS",
          attemptNumber: 1,
          submittedAt: null,
        }),
      );
      expect(result.canAttempt).toBe(false);
      expect(result.timeRemainingSeconds).toBeGreaterThan(280 * 60);
    });

    it("allows a retake after a completed attempt when attempts remain", async () => {
      prisma.assignment.findFirst.mockResolvedValue({
        ...assignmentRow,
        maxAttempts: 2,
      });
      prisma.assignmentSubmission.findMany.mockResolvedValue([
        {
          id: "s1",
          studentId: userId,
          status: "SUBMITTED",
          attemptNumber: 1,
          startedAt: new Date(),
          submittedAt: new Date(),
          content: "first answer",
          attachments: null,
        },
      ]);

      const result = await service.getStudentAssignmentView(
        tenantId,
        userId,
        "a1",
      );

      expect(result.studentAttemptCount).toBe(1);
      expect(result.activeSubmission).toBeNull();
      expect(result.canAttempt).toBe(true);
      expect(result.timeRemainingSeconds).toBeUndefined();
    });

    it("blocks a new attempt after the configured maximum", async () => {
      prisma.assignment.findFirst.mockResolvedValue({
        ...assignmentRow,
        maxAttempts: 1,
      });
      prisma.assignmentSubmission.findMany.mockResolvedValue([
        {
          id: "s1",
          studentId: userId,
          status: "GRADED",
          attemptNumber: 1,
          startedAt: new Date(),
          submittedAt: new Date(),
          content: "first answer",
          attachments: null,
        },
      ]);

      const result = await service.getStudentAssignmentView(
        tenantId,
        userId,
        "a1",
      );

      expect(result.canAttempt).toBe(false);
      expect(result.activeSubmission).toBeNull();
    });
  });

  describe("getAssignmentTimer", () => {
    it("uses the attempt's startedAt, not its final submission time", async () => {
      const startedAt = new Date();
      startedAt.setMinutes(startedAt.getMinutes() - 5);
      prisma.assignmentSubmission.findFirst.mockResolvedValue({
        id: "s1",
        status: "IN_PROGRESS",
        startedAt,
        submittedAt: null,
        assignment: { timerMinutes: 300 },
      });

      const result = await service.getAssignmentTimer(
        tenantId,
        userId,
        "a1",
      );

      expect(result.timeRemainingSeconds).toBeGreaterThan(290 * 60);
      expect(result.isExpired).toBe(false);
    });
  });

  describe("getSubmissionsForGrading", () => {
    it("excludes in-progress attempts from the teacher queue", async () => {
      prisma.assignmentSubmission.findMany.mockResolvedValue([]);

      await service.getSubmissionsForGrading(tenantId, "a1", {});

      expect(prisma.assignmentSubmission.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ submittedAt: { not: null } }),
        }),
      );
    });
  });
});
