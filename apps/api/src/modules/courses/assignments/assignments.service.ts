import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../../tenants/prisma.service';
import { Prisma, AssignmentStatus, SubmissionStatus, LessonType } from '@prisma/client';
import { IdempotencyService } from '../../payments/security/idempotency.service';
import { ProgressionService } from '../progression/progression.service';

@Injectable()
export class AssignmentsService {
  private readonly DEFAULT_TIMER_MINUTES = 300; // 5 hours
  private readonly MAX_TIMER_MINUTES = 10080; // 1 week

  constructor(
    private prisma: PrismaService,
    private idempotencyService: IdempotencyService,
    private progressionService: ProgressionService,
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
      throw new NotFoundException('Lesson not found');
    }
    if (lesson.assignment) {
      throw new ConflictException('Lesson already has an assignment');
    }
    if (lesson.type !== LessonType.ASSIGNMENT) {
      throw new BadRequestException('Lesson type must be ASSIGNMENT to create an assignment');
    }

    const timerMinutes = dto.timerMinutes ?? this.DEFAULT_TIMER_MINUTES;
    if (timerMinutes > this.MAX_TIMER_MINUTES) {
      throw new BadRequestException(`Timer cannot exceed ${this.MAX_TIMER_MINUTES} minutes`);
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

  async getAssignment(tenantId: string, assignmentId: string, includeSubmissions = false) {
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
      throw new NotFoundException('Assignment not found');
    }
    return assignment;
  }

  async listAssignments(
    tenantId: string,
    filters: { lessonId?: string; status?: AssignmentStatus; cursor?: string; limit?: number },
  ) {
    const where: Prisma.AssignmentWhereInput = { tenantId };
    if (filters.lessonId) where.lessonId = filters.lessonId;
    if (filters.status) where.status = filters.status;

    const limit = filters.limit ?? 20;
    const assignments = await this.prisma.assignment.findMany({
      where,
      orderBy: { createdAt: 'desc' },
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
          status: { in: [SubmissionStatus.SUBMITTED] },
        },
      });
      if (activeAttempts > 0) {
        throw new BadRequestException('Cannot change timer while there are active submissions');
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
      data: { status: 'PUBLISHED', publishedAt: new Date() },
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
      throw new NotFoundException('Submission not found');
    }
    if (submission.status === SubmissionStatus.GRADED) {
      throw new ConflictException('Submission already graded');
    }
    if (dto.score < 0 || dto.score > 100) {
      throw new BadRequestException('Score must be between 0 and 100');
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

  async getStudentAssignmentView(tenantId: string, userId: string, assignmentId: string) {
    const assignment = await this.getAssignment(tenantId, assignmentId, true);

    // Check enrollment
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: assignment.lessonId },
      include: { section: { include: { course: true } } },
    });

    const enrollment = await this.prisma.enrollment.findFirst({
      where: {
        userId,
        courseId: lesson.section.courseId,
        status: 'ACTIVE',
      },
    });

    if (!enrollment) {
      throw new ForbiddenException('Not enrolled in this course');
    }

    // Get student's submissions
    const submissions = assignment.submissions.filter((s) => s.studentId === userId);
    const attemptCount = submissions.length;

    // Check if can attempt
    const canAttempt = await this.canStudentAttempt(assignment, attemptCount, submissions);

    // Get active attempt (in progress)
    const activeSubmission = submissions.find(
      (s) => s.status === SubmissionStatus.SUBMITTED,
    );

    let timeRemainingSeconds: number | undefined;
    let isExpired = false;

    if (activeSubmission) {
      const expiresAt = new Date(activeSubmission.submittedAt);
      expiresAt.setMinutes(expiresAt.getMinutes() + assignment.timerMinutes);
      const now = new Date();
      timeRemainingSeconds = Math.max(0, Math.floor((expiresAt.getTime() - now.getTime()) / 1000));
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
            submittedAt: activeSubmission.submittedAt,
            content: activeSubmission.content,
            attachments: activeSubmission.attachments,
          }
        : null,
    };
  }

  private async canStudentAttempt(
    assignment: any,
    attemptCount: number,
    submissions: any[],
  ): Promise<boolean> {
    if (attemptCount >= assignment.maxAttempts) {
      return false;
    }

    // Check if there's an active (not graded/expired) attempt
    const hasActiveAttempt = submissions.some(
      (s) => s.status === SubmissionStatus.SUBMITTED || s.status === SubmissionStatus.LATE,
    );

    if (hasActiveAttempt) {
      return false;
    }

    return true;
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
      'assignment:start',
      { assignmentId },
    );

    if (!idempotencyResult.isNew && idempotencyResult.response !== undefined) {
      // Return cached response
      return idempotencyResult.response;
    }

    const assignment = await this.getAssignment(tenantId, assignmentId);

    if (assignment.status !== AssignmentStatus.PUBLISHED) {
      throw new BadRequestException('Assignment is not published');
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
        status: 'ACTIVE',
      },
    });

    if (!enrollment) {
      throw new ForbiddenException('Not enrolled in this course');
    }

    // Check attempt count
    const attemptCount = await this.prisma.assignmentSubmission.count({
      where: { assignmentId, studentId: userId },
    });

    if (attemptCount >= assignment.maxAttempts) {
      throw new BadRequestException('Maximum attempts reached');
    }

    // Check for active attempt
    const activeSubmission = await this.prisma.assignmentSubmission.findFirst({
      where: {
        assignmentId,
        studentId: userId,
        status: { in: [SubmissionStatus.SUBMITTED, SubmissionStatus.LATE] },
      },
    });

    if (activeSubmission) {
      throw new ConflictException('You already have an active attempt');
    }

    // Create submission with server-authoritative timer
    const startedAt = new Date();
    const expiresAt = new Date(startedAt);
    expiresAt.setMinutes(expiresAt.getMinutes() + assignment.timerMinutes);

    const submission = await this.prisma.assignmentSubmission.create({
      data: {
        tenantId,
        assignmentId,
        studentId: userId,
        status: SubmissionStatus.SUBMITTED,
        submittedAt: startedAt, // This serves as startedAt for timer
      },
    });

    const response = {
      attemptId: submission.id,
      assignmentId,
      startedAt,
      expiresAt,
      timeRemainingSeconds: assignment.timerMinutes * 60,
      timerMinutes: assignment.timerMinutes,
    };

    // Store idempotency response
    await this.idempotencyService.markCompleted(tenantId, idempotencyKey, response);

    // Trigger progression: ENTER_ASSIGNMENT → unlock linked exam
    await this.progressionService.handleEnterAssignment(
      tenantId,
      userId,
      assignmentId,
      lesson.id,
      `${idempotencyKey}:progression`,
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
      'assignment:submit',
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
        status: { in: [SubmissionStatus.SUBMITTED, SubmissionStatus.LATE] },
      },
      include: { assignment: true },
    });

    if (!submission) {
      throw new NotFoundException('No active attempt found');
    }

    const assignment = submission.assignment;
    const now = new Date();
    const expiresAt = new Date(submission.submittedAt);
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
          ? 'Submitted late'
          : 'Submission rejected: timer expired'
        : 'Submitted successfully',
    };

    await this.idempotencyService.markCompleted(tenantId, dto.idempotencyKey, response);
    return response;
  }

  async getAssignmentTimer(tenantId: string, userId: string, assignmentId: string) {
    const submission = await this.prisma.assignmentSubmission.findFirst({
      where: {
        assignmentId,
        studentId: userId,
        status: { in: [SubmissionStatus.SUBMITTED, SubmissionStatus.LATE] },
      },
      include: { assignment: true },
    });

    if (!submission) {
      throw new NotFoundException('No active attempt found');
    }

    const assignment = submission.assignment;
    const now = new Date();
    const expiresAt = new Date(submission.submittedAt);
    expiresAt.setMinutes(expiresAt.getMinutes() + assignment.timerMinutes);
    const timeRemainingSeconds = Math.max(0, Math.floor((expiresAt.getTime() - now.getTime()) / 1000));
    const isExpired = timeRemainingSeconds === 0;

    return {
      expiresAt,
      timeRemainingSeconds,
      isExpired,
      status: submission.status,
    };
  }

  async getStudentSubmissions(tenantId: string, userId: string, assignmentId: string) {
    const submissions = await this.prisma.assignmentSubmission.findMany({
      where: { assignmentId, studentId: userId, tenantId },
      orderBy: { submittedAt: 'desc' },
      include: { assignment: { select: { timerMinutes: true, passingScore: true } } },
    });

    return submissions.map((s) => {
      const expiresAt = new Date(s.submittedAt);
      expiresAt.setMinutes(expiresAt.getMinutes() + (s.assignment?.timerMinutes ?? this.DEFAULT_TIMER_MINUTES));
      const now = new Date();
      const timeRemainingSeconds = Math.max(0, Math.floor((expiresAt.getTime() - now.getTime()) / 1000));
      const isExpired = timeRemainingSeconds === 0;
      return {
        ...s,
        isLate: s.status === SubmissionStatus.LATE,
        timeRemainingSeconds,
        isExpired,
      };
    });
  }

  // ==================== TEACHER GRADING ====================

  async getSubmissionsForGrading(
    tenantId: string,
    assignmentId: string,
    filters: { status?: SubmissionStatus; cursor?: string; limit?: number },
  ) {
    const where: Prisma.AssignmentSubmissionWhereInput = { assignmentId, tenantId };
    if (filters.status) where.status = filters.status;

    const limit = filters.limit ?? 20;
    const submissions = await this.prisma.assignmentSubmission.findMany({
      where,
      orderBy: { submittedAt: 'asc' }, // Oldest first for grading queue
      take: limit + 1,
      cursor: filters.cursor ? { id: filters.cursor } : undefined,
      include: {
        student: { select: { id: true, name: true, phone: true, email: true } },
        assignment: { select: { timerMinutes: true, passingScore: true, maxAttempts: true } },
      },
    });

    let nextCursor: string | null = null;
    if (submissions.length > limit) {
      const next = submissions.pop();
      nextCursor = next!.id;
    }

    return {
      submissions: submissions.map((s) => {
        const expiresAt = new Date(s.submittedAt);
        expiresAt.setMinutes(expiresAt.getMinutes() + (s.assignment?.timerMinutes ?? this.DEFAULT_TIMER_MINUTES));
        const now = new Date();
        const timeRemainingSeconds = Math.max(0, Math.floor((expiresAt.getTime() - now.getTime()) / 1000));
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
