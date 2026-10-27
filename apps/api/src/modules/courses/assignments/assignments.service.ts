import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
  InternalServerErrorException,
} from "@nestjs/common";
import { PrismaService } from "../../tenants/prisma.service";
import {
  Prisma,
  AssignmentStatus,
  SubmissionStatus,
  LessonType,
} from "@prisma/client";
import { IdempotencyService } from "../../payments/security/idempotency.service";
import { ProgressionService } from "../progression/progression.service";
import { assertLessonAccessible } from "../lessons/lesson-access";
import { SanadClient, SanadError, SanadGrading } from "./sanad.client";
import { resolveBranchSources } from "./sanad.scope";

@Injectable()
export class AssignmentsService {
  private readonly DEFAULT_TIMER_MINUTES = 300; // 5 hours
  private readonly MAX_TIMER_MINUTES = 10080; // 1 week

  constructor(
    private prisma: PrismaService,
    private idempotencyService: IdempotencyService,
    private progressionService: ProgressionService,
    // Optional for backward-compatible unit construction; the NestJS module
    // always provides SanadClient. evaluateAssignmentWithAI throws honestly
    // when it is absent instead of fabricating a score.
    private sanad?: SanadClient,
  ) {}

  // ==================== TEACHER METHODS ====================

  async createAssignment(
    tenantId: string,
    userId: string,
    lessonId: string,
    dto: any,
  ) {
    // Verify lesson exists and belongs to tenant
    const lesson = await this.prisma.lesson.findFirst({
      where: { id: lessonId, tenantId },
      include: { assignment: true },
    });

    if (!lesson) {
      throw new NotFoundException("Lesson not found");
    }
    if (lesson.assignment) {
      throw new ConflictException("Lesson already has an assignment");
    }
    if (lesson.type !== LessonType.ASSIGNMENT) {
      throw new BadRequestException(
        "Lesson type must be ASSIGNMENT to create an assignment",
      );
    }

    const timerMinutes = dto.timerMinutes ?? this.DEFAULT_TIMER_MINUTES;
    if (timerMinutes > this.MAX_TIMER_MINUTES) {
      throw new BadRequestException(
        `Timer cannot exceed ${this.MAX_TIMER_MINUTES} minutes`,
      );
    }

    const assignment = await this.prisma.assignment.create({
      data: {
        tenantId,
        lessonId,
        title: dto.title,
        description: dto.description,
        instructions: dto.instructions,
        timerMinutes,
        passingScore: dto.passingScore,
        maxAttempts: dto.maxAttempts ?? 1,
        allowLateSubmission: dto.allowLateSubmission ?? true,
        latePenaltyPercent: dto.latePenaltyPercent ?? 0,
        status: AssignmentStatus.DRAFT,
      },
    });

    // Update lesson with assignment reference
    await this.prisma.lesson.update({
      where: { id: lessonId },
      data: { assignmentId: assignment.id },
    });

    return assignment;
  }

  async getAssignment(
    tenantId: string,
    assignmentId: string,
    includeSubmissions = false,
  ) {
    const assignment = await this.prisma.assignment.findFirst({
      where: { id: assignmentId, tenantId },
      include: {
        lesson: {
          select: { id: true, title: true, sectionId: true },
        },
        submissions: includeSubmissions,
      },
    });

    if (!assignment) {
      throw new NotFoundException("Assignment not found");
    }
    return assignment;
  }

  async listAssignments(
    tenantId: string,
    filters: {
      lessonId?: string;
      status?: AssignmentStatus;
      cursor?: string;
      limit?: number;
    },
    options?: { studentSafe?: boolean },
  ) {
    const where: Prisma.AssignmentWhereInput = { tenantId };
    if (filters.lessonId) where.lessonId = filters.lessonId;
    if (filters.status) where.status = filters.status;

    const limit = filters.limit ?? 20;
    const assignments: any[] = options?.studentSafe
      ? await this.prisma.assignment.findMany({
          where,
          orderBy: { createdAt: "desc" },
          take: limit + 1,
          cursor: filters.cursor ? { id: filters.cursor } : undefined,
          // Student index: navigation metadata only. Description,
          // instructions, attempts and grading fields stay behind `/view`,
          // which enforces enrollment + the per-student lesson grant.
          select: {
            id: true,
            title: true,
            status: true,
            lessonId: true,
            timerMinutes: true,
            lesson: { select: { id: true, title: true } },
          },
        })
      : await this.prisma.assignment.findMany({
          where,
          orderBy: { createdAt: "desc" },
          take: limit + 1,
          cursor: filters.cursor ? { id: filters.cursor } : undefined,
          include: { lesson: { select: { id: true, title: true } } },
        });

    let nextCursor: string | null = null;
    if (assignments.length > limit) {
      const next = assignments.pop();
      nextCursor = next!.id;
    }

    return { assignments, nextCursor };
  }

  async updateAssignment(tenantId: string, assignmentId: string, dto: any) {
    const assignment = await this.getAssignment(tenantId, assignmentId);

    // Cannot change timer if there are active attempts
    if (dto.timerMinutes && dto.timerMinutes !== assignment.timerMinutes) {
      const activeAttempts = await this.prisma.assignmentSubmission.count({
        where: {
          assignmentId,
          // Active means the attempt has not been submitted yet. SUBMITTED
          // is a final state once the student actually hands the work in.
          submittedAt: null,
        },
      });
      if (activeAttempts > 0) {
        throw new BadRequestException(
          "Cannot change timer while there are active submissions",
        );
      }
    }

    const updated = await this.prisma.assignment.update({
      where: { id: assignmentId },
      data: {
        title: dto.title,
        description: dto.description,
        instructions: dto.instructions,
        timerMinutes: dto.timerMinutes,
        passingScore: dto.passingScore,
        maxAttempts: dto.maxAttempts,
        allowLateSubmission: dto.allowLateSubmission,
        latePenaltyPercent: dto.latePenaltyPercent,
        status: dto.status,
      },
    });

    return updated;
  }

  async publishAssignment(tenantId: string, assignmentId: string) {
    const assignment = await this.getAssignment(tenantId, assignmentId);

    if (assignment.status === AssignmentStatus.PUBLISHED) {
      return assignment;
    }

    const updated = await this.prisma.assignment.update({
      where: { id: assignmentId },
      data: { status: AssignmentStatus.PUBLISHED },
    });

    // Also publish the lesson if it's not published
    await this.prisma.lesson.update({
      where: { id: assignment.lessonId },
      data: { status: "PUBLISHED", publishedAt: new Date() },
    });

    return updated;
  }

  async archiveAssignment(tenantId: string, assignmentId: string) {
    const assignment = await this.getAssignment(tenantId, assignmentId);

    const updated = await this.prisma.assignment.update({
      where: { id: assignmentId },
      data: { status: AssignmentStatus.ARCHIVED },
    });

    return updated;
  }

  async gradeSubmission(
    tenantId: string,
    submissionId: string,
    teacherId: string,
    dto: { score: number; feedback?: string },
  ) {
    const submission = await this.prisma.assignmentSubmission.findFirst({
      where: { id: submissionId, tenantId },
      include: { assignment: true },
    });

    if (!submission) {
      throw new NotFoundException("Submission not found");
    }
    if (submission.status === SubmissionStatus.IN_PROGRESS) {
      throw new ConflictException("Attempt has not been submitted yet");
    }
    if (submission.status === SubmissionStatus.GRADED) {
      throw new ConflictException("Submission already graded");
    }
    if (dto.score < 0 || dto.score > 100) {
      throw new BadRequestException("Score must be between 0 and 100");
    }

    const updated = await this.prisma.assignmentSubmission.update({
      where: { id: submissionId },
      data: {
        status: SubmissionStatus.GRADED,
        score: dto.score,
        gradedBy: teacherId,
        gradedAt: new Date(),
        feedback: dto.feedback,
      },
    });

    // Check if passing score is met and trigger progression unlock
    const assignment = submission.assignment;
    if (assignment.passingScore && dto.score >= assignment.passingScore) {
      // Progression unlock will be handled by progression service
      // We just record the grade here
    }

    return updated;
  }

  // ==================== STUDENT METHODS ====================

  async getStudentAssignmentView(
    tenantId: string,
    userId: string,
    assignmentId: string,
  ) {
    // Student view: never load other students' submissions. Fetch the
    // assignment alone, then query ONLY this student's rows (leak fix 2026-10-16).
    const assignment = await this.getAssignment(tenantId, assignmentId);

    // Check enrollment
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: assignment.lessonId },
      include: { section: { include: { course: true } } },
    });

    const enrollment = await this.prisma.enrollment.findFirst({
      where: {
        userId,
        courseId: lesson.section.courseId,
        status: "ACTIVE",
      },
    });

    if (!enrollment) {
      throw new ForbiddenException("Not enrolled in this course");
    }

    // The lesson page hides locked assessments, so the API must do the same:
    // otherwise the assignment id is a direct bypass around the lock.
    await assertLessonAccessible(this.prisma, tenantId, userId, lesson);

    // ONLY this student's submissions — previously every student's content,
    // score and feedback leaked into the response via `...assignment`.
    const submissions = await this.prisma.assignmentSubmission.findMany({
      where: { tenantId, assignmentId, studentId: userId },
      orderBy: { attemptNumber: "desc" },
    });
    const attemptCount = submissions.length;

    // The active attempt is the row without a submission timestamp. It is
    // intentionally separate from SUBMITTED: a submitted on-time answer must
    // not block the next allowed retake.
    const activeSubmission = submissions.find((s) => s.submittedAt === null);
    const canAttempt = this.canStudentAttempt(
      assignment,
      attemptCount,
      activeSubmission,
    );

    let timeRemainingSeconds: number | undefined;
    let isExpired = false;

    if (activeSubmission) {
      const expiresAt = new Date(activeSubmission.startedAt);
      expiresAt.setMinutes(expiresAt.getMinutes() + assignment.timerMinutes);
      const now = new Date();
      timeRemainingSeconds = Math.max(
        0,
        Math.floor((expiresAt.getTime() - now.getTime()) / 1000),
      );
      isExpired = timeRemainingSeconds === 0;
    }

    return {
      ...assignment,
      studentAttemptCount: attemptCount,
      canAttempt,
      timeRemainingSeconds,
      isExpired,
      activeSubmission: activeSubmission
        ? {
            id: activeSubmission.id,
            status: activeSubmission.status,
            attemptNumber: activeSubmission.attemptNumber,
            startedAt: activeSubmission.startedAt,
            submittedAt: activeSubmission.submittedAt,
            content: activeSubmission.content,
            attachments: activeSubmission.attachments,
          }
        : null,
    };
  }

  private canStudentAttempt(
    assignment: any,
    attemptCount: number,
    activeSubmission: unknown,
  ): boolean {
    return attemptCount < assignment.maxAttempts && !activeSubmission;
  }

  async startAssignmentAttempt(
    tenantId: string,
    userId: string,
    assignmentId: string,
    idempotencyKey: string,
  ) {
    // Check idempotency
    const idempotencyResult = await this.idempotencyService.checkAndStore(
      tenantId,
      userId,
      idempotencyKey,
      "assignment:start",
      { assignmentId },
    );

    if (!idempotencyResult.isNew && idempotencyResult.response !== undefined) {
      // Return cached response
      return idempotencyResult.response;
    }

    const assignment = await this.getAssignment(tenantId, assignmentId);

    if (assignment.status !== AssignmentStatus.PUBLISHED) {
      throw new BadRequestException("Assignment is not published");
    }

    // Check enrollment
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: assignment.lessonId },
      include: { section: { include: { course: true } } },
    });

    const enrollment = await this.prisma.enrollment.findFirst({
      where: {
        userId,
        courseId: lesson.section.courseId,
        status: "ACTIVE",
      },
    });

    if (!enrollment) {
      throw new ForbiddenException("Not enrolled in this course");
    }

    // Starting an attempt is the ENTER_ASSIGNMENT progression event. It must
    // only be reachable after the earlier lesson has unlocked this one.
    await assertLessonAccessible(this.prisma, tenantId, userId, lesson);

    // Check attempt count
    const attemptCount = await this.prisma.assignmentSubmission.count({
      where: { assignmentId, studentId: userId },
    });

    if (attemptCount >= assignment.maxAttempts) {
      throw new BadRequestException("Maximum attempts reached");
    }

    // Check for active attempt
    const activeSubmission = await this.prisma.assignmentSubmission.findFirst({
      where: {
        assignmentId,
        studentId: userId,
        submittedAt: null,
      },
    });

    if (activeSubmission) {
      throw new ConflictException("You already have an active attempt");
    }

    // Create submission with server-authoritative timer. `submittedAt` stays
    // null until the student actually hands the work in; `startedAt` is the
    // timer origin for this specific attempt.
    const startedAt = new Date();
    const expiresAt = new Date(startedAt);
    expiresAt.setMinutes(expiresAt.getMinutes() + assignment.timerMinutes);
    const attemptNumber = attemptCount + 1;

    let submission;
    try {
      submission = await this.prisma.assignmentSubmission.create({
        data: {
          tenantId,
          assignmentId,
          studentId: userId,
          status: SubmissionStatus.IN_PROGRESS,
          attemptNumber,
          startedAt,
          submittedAt: null,
        },
      });
    } catch (error) {
      // The unique (assignmentId, studentId, attemptNumber) index closes the
      // concurrent-start race: two requests can both read count=0, but only
      // one insert can win.
      if ((error as { code?: string } | null)?.code === "P2002") {
        throw new ConflictException("You already have an active attempt");
      }
      throw error;
    }

    // Trigger progression ONCE: ENTER_ASSIGNMENT → unlock the linked exam
    // lesson for THIS student (audit 2026-10-16 §6.1 — this used to be a
    // tenant-wide flip AND the controller called it a second time). It runs
    // before the idempotent response is stored so retries return the same
    // unlock data.
    const unlocked = await this.progressionService.handleEnterAssignment(
      tenantId,
      userId,
      assignmentId,
      lesson.id,
      `${idempotencyKey}:progression`,
    );

    const response = {
      attemptId: submission.id,
      assignmentId,
      attemptNumber: submission.attemptNumber ?? attemptNumber,
      startedAt,
      expiresAt,
      timeRemainingSeconds: assignment.timerMinutes * 60,
      timerMinutes: assignment.timerMinutes,
      unlocked,
    };

    // Store idempotency response
    await this.idempotencyService.markCompleted(
      tenantId,
      idempotencyKey,
      response,
    );

    return response;
  }

  async submitAssignment(
    tenantId: string,
    userId: string,
    assignmentId: string,
    dto: { content?: string; attachments?: any[]; idempotencyKey: string },
  ) {
    // Check idempotency
    const idempotencyResult = await this.idempotencyService.checkAndStore(
      tenantId,
      userId,
      dto.idempotencyKey,
      "assignment:submit",
      { assignmentId, content: dto.content, attachments: dto.attachments },
    );

    if (!idempotencyResult.isNew && idempotencyResult.response !== undefined) {
      return idempotencyResult.response;
    }

    // Find active submission
    const submission = await this.prisma.assignmentSubmission.findFirst({
      where: {
        assignmentId,
        studentId: userId,
        submittedAt: null,
      },
      include: { assignment: true },
    });

    if (!submission) {
      throw new NotFoundException("No active attempt found");
    }

    const assignment = submission.assignment;
    const now = new Date();
    const expiresAt = new Date(submission.startedAt);
    expiresAt.setMinutes(expiresAt.getMinutes() + assignment.timerMinutes);

    // Check if expired
    const isExpired = now > expiresAt;

    let status: SubmissionStatus = SubmissionStatus.SUBMITTED;
    if (isExpired) {
      if (!assignment.allowLateSubmission) {
        status = SubmissionStatus.REJECTED;
      } else {
        status = SubmissionStatus.LATE;
      }
    }

    const updated = await this.prisma.assignmentSubmission.update({
      where: { id: submission.id },
      data: {
        content: dto.content,
        attachments: dto.attachments as any,
        status,
        submittedAt: now, // Update to actual submission time
      },
    });

    const response = {
      attemptId: updated.id,
      status: updated.status,
      submittedAt: updated.submittedAt,
      isLate: status === SubmissionStatus.LATE,
      message: isExpired
        ? assignment.allowLateSubmission
          ? "Submitted late"
          : "Submission rejected: timer expired"
        : "Submitted successfully",
    };

    await this.idempotencyService.markCompleted(
      tenantId,
      dto.idempotencyKey,
      response,
    );
    return response;
  }

  async getAssignmentTimer(
    tenantId: string,
    userId: string,
    assignmentId: string,
  ) {
    const submission = await this.prisma.assignmentSubmission.findFirst({
      where: {
        assignmentId,
        studentId: userId,
        submittedAt: null,
      },
      include: { assignment: true },
    });

    if (!submission) {
      throw new NotFoundException("No active attempt found");
    }

    const assignment = submission.assignment;
    const now = new Date();
    const expiresAt = new Date(submission.startedAt);
    expiresAt.setMinutes(expiresAt.getMinutes() + assignment.timerMinutes);
    const timeRemainingSeconds = Math.max(
      0,
      Math.floor((expiresAt.getTime() - now.getTime()) / 1000),
    );
    const isExpired = timeRemainingSeconds === 0;

    return {
      expiresAt,
      timeRemainingSeconds,
      isExpired,
      status: submission.status,
    };
  }

  async getStudentSubmissions(
    tenantId: string,
    userId: string,
    assignmentId: string,
  ) {
    const submissions = await this.prisma.assignmentSubmission.findMany({
      where: { assignmentId, studentId: userId, tenantId },
      orderBy: [{ attemptNumber: "desc" }, { startedAt: "desc" }],
      include: {
        assignment: { select: { timerMinutes: true, passingScore: true } },
      },
    });

    return submissions.map((s) => {
      const expiresAt = new Date(s.startedAt);
      expiresAt.setMinutes(
        expiresAt.getMinutes() +
          (s.assignment?.timerMinutes ?? this.DEFAULT_TIMER_MINUTES),
      );
      const now = new Date();
      const timeRemainingSeconds = Math.max(
        0,
        Math.floor((expiresAt.getTime() - now.getTime()) / 1000),
      );
      const isExpired = timeRemainingSeconds === 0;
      return {
        ...s,
        isLate: s.status === SubmissionStatus.LATE,
        timeRemainingSeconds,
        isExpired,
      };
    });
  }

  async evaluateAssignmentWithAI(
    tenantId: string,
    studentId: string,
    assignmentId: string,
    answer: string,
    question?: string,
    grading?: SanadGrading,
    sourceIds?: string[],
    branches?: string[],
  ) {
    // Build idempotency key to cache AI evaluation results
    // Use answer directly as part of key (no hashCode needed - strings work as keys)
    const idempotencyKey = `ai-eval-${assignmentId}-${studentId}-${answer}`;

    // Check for cached result using checkAndStore
    const idempotencyResult = await this.idempotencyService.checkAndStore(
      tenantId,
      studentId,
      idempotencyKey,
      "assignment:ai-eval",
      { answer, question },
    );

    // Return cached result if available
    if (
      idempotencyResult.isNew === false &&
      idempotencyResult.response !== undefined
    ) {
      return {
        success: true,
        data: idempotencyResult.response,
        message: "Answer evaluated successfully by AI (cached)",
      };
    }

    // Real SANAD call — no fake defaults. The teacher dashboard must send
    // the rubric + reference answer, plus either explicit knowledge sources
    // or branch names (resolved server-side to sources; single source of
    // truth in sanad.scope.ts). SANAD returns 422 when rubric sum !=
    // max_score or the resolved source list is empty.
    const resolvedSourceIds = sourceIds?.length
      ? sourceIds
      : [...new Set((branches ?? []).flatMap((b) => resolveBranchSources(b)))];
    if (!grading || !resolvedSourceIds.length) {
      throw new BadRequestException(
        "AI evaluation requires grading {reference_answer, max_score, rubric_version, criteria[]} and sourceIds or branches",
      );
    }
    if (!this.sanad) {
      throw new InternalServerErrorException(
        "AI evaluation service is not configured",
      );
    }

    let result;
    try {
      result = await this.sanad.evaluateSubmission({
        tenantId,
        questionText: question ?? "",
        studentAnswer: answer,
        grading,
        sourceIds: resolvedSourceIds,
      });
    } catch (e) {
      if (e instanceof SanadError && (e.status === 401 || e.status === 422)) {
        throw new BadRequestException(`SANAD rejected evaluation: ${e.detail}`);
      }
      throw new InternalServerErrorException(
        "AI evaluation service temporarily unavailable, please retry",
      );
    }

    // Suggested score only — the official grade is set exclusively by
    // POST submissions/:submissionId/grade after teacher review.
    const evaluation = {
      score: result.suggested_score,
      maxScore: result.max_score,
      feedback: result.feedback_ar,
      criteria: result.criteria,
      knowledgeGap: result.knowledge_gaps,
      needsTeacherReview: result.needs_teacher_review,
      reviewSignal: result.review_signal,
      sanadRequestId: result.request_id,
      sanadSubmissionId: result.sanad_submission_id,
      model: result.provenance,
      evaluatedAt: new Date(),
    };

    return {
      success: true,
      data: evaluation,
      message: "Answer evaluated successfully by AI",
    };
  }

  /**
   * "Ask SANAD" evidence explorer — pure extractive retrieval, no LLM.
   * The branch sub-filter resolves server-side to explicit source_ids
   * (sanad.scope.ts); unknown/empty scopes return [] instead of
   * searching everything by accident.
   */
  async askSanad(
    tenantId: string,
    assignmentId: string,
    question: string,
    branch?: string,
  ) {
    // tenantId/assignmentId are accepted for signature consistency and
    // future per-tenant source mapping; scope currently comes from branch.
    const sourceIds = resolveBranchSources(branch);
    if (!sourceIds.length) {
      return { success: true, data: { passages: [], branch: branch ?? "all" } };
    }
    if (!this.sanad) {
      throw new InternalServerErrorException(
        "AI evaluation service is not configured",
      );
    }
    const result = await this.sanad.queryExtract(question, {
      topK: 5,
      sourceIds,
    });
    return {
      success: true,
      data: { ...result, branch: branch ?? "all" },
    };
  }

  // ==================== TEACHER GRADING ====================

  async getSubmissionsForGrading(
    tenantId: string,
    assignmentId: string,
    filters: { status?: SubmissionStatus; cursor?: string; limit?: number },
  ) {
    const where: Prisma.AssignmentSubmissionWhereInput = {
      assignmentId,
      tenantId,
      // In-progress attempts have no submittedAt and must never enter the
      // teacher's grading queue.
      submittedAt: { not: null },
    };
    if (filters.status) where.status = filters.status;

    const limit = filters.limit ?? 20;
    const submissions = await this.prisma.assignmentSubmission.findMany({
      where,
      orderBy: { submittedAt: "asc" }, // Oldest first for grading queue
      take: limit + 1,
      cursor: filters.cursor ? { id: filters.cursor } : undefined,
      include: {
        student: { select: { id: true, name: true, phone: true, email: true } },
        assignment: {
          select: { timerMinutes: true, passingScore: true, maxAttempts: true },
        },
      },
    });

    let nextCursor: string | null = null;
    if (submissions.length > limit) {
      const next = submissions.pop();
      nextCursor = next!.id;
    }

    return {
      submissions: submissions.map((s) => {
        const expiresAt = new Date(s.startedAt);
        expiresAt.setMinutes(
          expiresAt.getMinutes() +
            (s.assignment?.timerMinutes ?? this.DEFAULT_TIMER_MINUTES),
        );
        const now = new Date();
        const timeRemainingSeconds = Math.max(
          0,
          Math.floor((expiresAt.getTime() - now.getTime()) / 1000),
        );
        const isExpired = timeRemainingSeconds === 0;
        return {
          ...s,
          isLate: s.status === SubmissionStatus.LATE,
          timeRemainingSeconds,
          isExpired,
        };
      }),
      nextCursor,
    };
  }
}
