import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from "@nestjs/common";
import { PrismaService } from "../../tenants/prisma.service";
import {
  Prisma,
  ExamStatus,
  AttemptStatus,
  LessonType,
  ExamQuestionType,
} from "@prisma/client";
import { IdempotencyService } from "../../payments/security/idempotency.service";
import { ProgressionService } from "../progression/progression.service";

@Injectable()
export class ExamsService {
  private readonly DEFAULT_TIMER_MINUTES = 70; // 70 minutes default
  private readonly MAX_TIMER_MINUTES = 10080; // 1 week

  constructor(
    private prisma: PrismaService,
    private idempotencyService: IdempotencyService,
    private progressionService: ProgressionService,
  ) {}

  // ==================== TEACHER METHODS ====================

  async createExam(
    tenantId: string,
    userId: string,
    lessonId: string,
    dto: any,
  ) {
    // Verify lesson exists and belongs to tenant
    const lesson = await this.prisma.lesson.findFirst({
      where: { id: lessonId, tenantId },
      include: { exam: true },
    });

    if (!lesson) {
      throw new NotFoundException("Lesson not found");
    }
    if (lesson.exam) {
      throw new ConflictException("Lesson already has an exam");
    }
    if (lesson.type !== LessonType.EXAM) {
      throw new BadRequestException(
        "Lesson type must be EXAM to create an exam",
      );
    }

    const timerMinutes = dto.timerMinutes ?? this.DEFAULT_TIMER_MINUTES;
    if (timerMinutes > this.MAX_TIMER_MINUTES) {
      throw new BadRequestException(
        `Timer cannot exceed ${this.MAX_TIMER_MINUTES} minutes`,
      );
    }

    const exam = await this.prisma.exam.create({
      data: {
        tenantId,
        lessonId,
        title: dto.title,
        description: dto.description,
        instructions: dto.instructions,
        timerMinutes,
        passingScore: dto.passingScore ?? 60,
        maxAttempts: dto.maxAttempts ?? 1,
        shuffleQuestions: dto.shuffleQuestions ?? false,
        shuffleOptions: dto.shuffleOptions ?? false,
        showResults: dto.showResults ?? true,
        showCorrectAnswers: dto.showCorrectAnswers ?? false,
        status: ExamStatus.DRAFT,
      },
    });

    // Update lesson with exam reference
    await this.prisma.lesson.update({
      where: { id: lessonId },
      data: { examId: exam.id },
    });

    return exam;
  }

  async getExam(
    tenantId: string,
    examId: string,
    includeQuestions = false,
    includeAttempts = false,
  ) {
    const exam = await this.prisma.exam.findFirst({
      where: { id: examId, tenantId },
      include: {
        lesson: {
          select: { id: true, title: true, sectionId: true },
        },
        questions: includeQuestions
          ? {
              orderBy: { position: "asc" },
            }
          : false,
        attempts: includeAttempts,
      },
    });

    if (!exam) {
      throw new NotFoundException("Exam not found");
    }

    // Hide correct answers from students
    if (includeQuestions) {
      exam.questions = exam.questions.map((q: any) => ({
        ...q,
        correctAnswer: undefined,
      }));
    }

    return exam;
  }

  async listExams(
    tenantId: string,
    filters: {
      lessonId?: string;
      status?: ExamStatus;
      cursor?: string;
      limit?: number;
    },
  ) {
    const where: Prisma.ExamWhereInput = { tenantId };
    if (filters.lessonId) where.lessonId = filters.lessonId;
    if (filters.status) where.status = filters.status;

    const limit = filters.limit ?? 20;
    const exams = await this.prisma.exam.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit + 1,
      cursor: filters.cursor ? { id: filters.cursor } : undefined,
      include: { lesson: { select: { id: true, title: true } } },
    });

    let nextCursor: string | null = null;
    if (exams.length > limit) {
      const next = exams.pop();
      nextCursor = next!.id;
    }

    return { exams, nextCursor };
  }

  async updateExam(tenantId: string, examId: string, dto: any) {
    const exam = await this.getExam(tenantId, examId);

    // Cannot change timer if there are active attempts
    if (dto.timerMinutes && dto.timerMinutes !== exam.timerMinutes) {
      const activeAttempts = await this.prisma.examAttempt.count({
        where: {
          examId,
          status: { in: [AttemptStatus.IN_PROGRESS, AttemptStatus.SUBMITTED] },
        },
      });
      if (activeAttempts > 0) {
        throw new BadRequestException(
          "Cannot change timer while there are active attempts",
        );
      }
    }

    const updated = await this.prisma.exam.update({
      where: { id: examId },
      data: {
        title: dto.title,
        description: dto.description,
        instructions: dto.instructions,
        timerMinutes: dto.timerMinutes,
        passingScore: dto.passingScore,
        maxAttempts: dto.maxAttempts,
        shuffleQuestions: dto.shuffleQuestions,
        shuffleOptions: dto.shuffleOptions,
        showResults: dto.showResults,
        showCorrectAnswers: dto.showCorrectAnswers,
        status: dto.status,
      },
    });

    return updated;
  }

  /**
   * Add a question to an exam. There is intentionally no other way to
   * create questions — this is the single writer (teacher-only route).
   */
  async addQuestion(
    tenantId: string,
    examId: string,
    dto: {
      type: ExamQuestionType;
      text: string;
      explanation?: string;
      points?: number;
      position?: number;
      options?: any[];
      correctAnswer?: any;
    },
  ) {
    const exam = await this.prisma.exam.findFirst({
      where: { id: examId, tenantId },
    });
    if (!exam) {
      throw new NotFoundException("Exam not found");
    }

    if (!Object.values(ExamQuestionType).includes(dto.type)) {
      throw new BadRequestException("Invalid question type");
    }
    if (!dto.text || dto.text.trim() === "") {
      throw new BadRequestException("Question text is required");
    }

    const position =
      dto.position ??
      (await this.prisma.examQuestion.count({ where: { examId } }));

    return this.prisma.examQuestion.create({
      data: {
        tenantId,
        examId,
        type: dto.type,
        text: dto.text,
        explanation: dto.explanation,
        points: dto.points ?? 1,
        position,
        options: (dto.options ?? null) as any,
        correctAnswer: (dto.correctAnswer ?? null) as any,
      },
    });
  }

  async publishExam(tenantId: string, examId: string) {
    const exam = await this.getExam(tenantId, examId);

    if (exam.status === ExamStatus.PUBLISHED) {
      return exam;
    }

    const updated = await this.prisma.exam.update({
      where: { id: examId },
      data: { status: ExamStatus.PUBLISHED },
    });

    // Also publish the lesson if it's not published
    await this.prisma.lesson.update({
      where: { id: exam.lessonId },
      data: { status: "PUBLISHED", publishedAt: new Date() },
    });

    return updated;
  }

  async archiveExam(tenantId: string, examId: string) {
    const exam = await this.getExam(tenantId, examId);

    const updated = await this.prisma.exam.update({
      where: { id: examId },
      data: { status: ExamStatus.ARCHIVED },
    });

    return updated;
  }

  async gradeExamAttempt(
    tenantId: string,
    attemptId: string,
    teacherId: string,
    dto: { score: number; feedback?: string; gradingData?: any },
  ) {
    const attempt = await this.prisma.examAttempt.findFirst({
      where: { id: attemptId, tenantId },
      include: { exam: true },
    });

    if (!attempt) {
      throw new NotFoundException("Attempt not found");
    }
    if (attempt.status === AttemptStatus.GRADED) {
      throw new ConflictException("Attempt already graded");
    }
    if (dto.score < 0 || dto.score > 100) {
      throw new BadRequestException("Score must be between 0 and 100");
    }

    const passed = dto.score >= attempt.exam.passingScore;

    const updated = await this.prisma.examAttempt.update({
      where: { id: attemptId },
      data: {
        status: AttemptStatus.GRADED,
        score: dto.score,
        passed,
        gradedBy: teacherId,
        gradedAt: new Date(),
        gradingData: dto.gradingData as any,
      },
    });

    return updated;
  }

  // ==================== STUDENT METHODS ====================

  async getStudentExamView(tenantId: string, userId: string, examId: string) {
    const exam = await this.getExam(tenantId, examId, true, true);

    // Check enrollment
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: exam.lessonId },
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

    // Get student's attempts
    const attempts = exam.attempts.filter((a) => a.studentId === userId);
    const attemptCount = attempts.length;

    // Check if can attempt
    const canAttempt = await this.canStudentAttempt(
      exam,
      attemptCount,
      attempts,
    );

    // Get active attempt (in progress)
    const activeAttempt = attempts.find(
      (a) => a.status === AttemptStatus.IN_PROGRESS,
    );

    let timeRemainingSeconds: number | undefined;
    let isExpired = false;

    if (activeAttempt) {
      const now = new Date();
      const expiresAt = new Date(activeAttempt.startedAt);
      expiresAt.setMinutes(expiresAt.getMinutes() + exam.timerMinutes);
      timeRemainingSeconds = Math.max(
        0,
        Math.floor((expiresAt.getTime() - now.getTime()) / 1000),
      );
      isExpired = timeRemainingSeconds === 0;
    }

    return {
      ...exam,
      studentAttemptCount: attemptCount,
      canAttempt,
      timeRemainingSeconds,
      isExpired,
      activeAttempt: activeAttempt
        ? {
            id: activeAttempt.id,
            status: activeAttempt.status,
            startedAt: activeAttempt.startedAt,
          }
        : null,
    };
  }

  private async canStudentAttempt(
    exam: any,
    attemptCount: number,
    attempts: any[],
  ): Promise<boolean> {
    if (attemptCount >= exam.maxAttempts) {
      return false;
    }

    // Check if there's an active (in progress) attempt
    const hasActiveAttempt = attempts.some(
      (a) => a.status === AttemptStatus.IN_PROGRESS,
    );

    if (hasActiveAttempt) {
      return false;
    }

    return true;
  }

  async startExamAttempt(
    tenantId: string,
    userId: string,
    examId: string,
    idempotencyKey: string,
  ) {
    // Check idempotency
    const idempotencyResult = await this.idempotencyService.checkAndStore(
      tenantId,
      userId,
      idempotencyKey,
      "exam:start",
      { examId },
    );

    if (!idempotencyResult.isNew && idempotencyResult.response !== undefined) {
      // Return cached response
      return idempotencyResult.response;
    }

    const exam = await this.getExam(tenantId, examId, true);

    if (exam.status !== ExamStatus.PUBLISHED) {
      throw new BadRequestException("Exam is not published");
    }

    // Check enrollment
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: exam.lessonId },
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

    // Check attempt count
    const attemptCount = await this.prisma.examAttempt.count({
      where: { examId, studentId: userId },
    });

    if (attemptCount >= exam.maxAttempts) {
      throw new BadRequestException("Maximum attempts reached");
    }

    // Check for active attempt
    const activeAttempt = await this.prisma.examAttempt.findFirst({
      where: {
        examId,
        studentId: userId,
        status: AttemptStatus.IN_PROGRESS,
      },
    });

    if (activeAttempt) {
      throw new ConflictException("You already have an active attempt");
    }

    // Get attempt number
    const attemptNumber = attemptCount + 1;

    // Shuffle questions if enabled
    let questions = exam.questions;
    if (exam.shuffleQuestions) {
      questions = this.shuffleArray([...questions]);
    }

    // Shuffle options if enabled
    if (exam.shuffleOptions) {
      questions = questions.map((q: any) => ({
        ...q,
        options: q.options ? this.shuffleArray([...q.options]) : q.options,
      }));
    }

    // Create attempt with server-authoritative timer
    const startedAt = new Date();
    const expiresAt = new Date(startedAt);
    expiresAt.setMinutes(expiresAt.getMinutes() + exam.timerMinutes);

    const attempt = await this.prisma.examAttempt.create({
      data: {
        tenantId,
        examId,
        studentId: userId,
        attemptNumber,
        status: AttemptStatus.IN_PROGRESS,
        startedAt,
        timeRemainingSeconds: exam.timerMinutes * 60,
      },
    });

    const response = {
      attemptId: attempt.id,
      examId,
      attemptNumber,
      startedAt,
      expiresAt,
      timeRemainingSeconds: exam.timerMinutes * 60,
      timerMinutes: exam.timerMinutes,
      questions: questions.map((q: any) => ({
        id: q.id,
        type: q.type,
        text: q.text,
        points: q.points,
        position: q.position,
        options: q.options,
        // correctAnswer intentionally omitted
      })),
    };

    // Store idempotency response
    await this.idempotencyService.markCompleted(
      tenantId,
      idempotencyKey,
      response,
    );

    // Trigger progression: ENTER_EXAM → unlock next lesson
    await this.progressionService.handleEnterExam(
      tenantId,
      userId,
      examId,
      lesson.id,
      `${idempotencyKey}:progression`,
    );

    return response;
  }

  async submitExamAttempt(
    tenantId: string,
    userId: string,
    examId: string,
    dto: { answers: any; idempotencyKey: string },
  ) {
    // Check idempotency
    const idempotencyResult = await this.idempotencyService.checkAndStore(
      tenantId,
      userId,
      dto.idempotencyKey,
      "exam:submit",
      { examId, answers: dto.answers },
    );

    if (!idempotencyResult.isNew && idempotencyResult.response !== undefined) {
      return idempotencyResult.response;
    }

    // Find active attempt
    const attempt = await this.prisma.examAttempt.findFirst({
      where: {
        examId,
        studentId: userId,
        status: AttemptStatus.IN_PROGRESS,
      },
      include: { exam: true },
    });

    if (!attempt) {
      throw new NotFoundException("No active attempt found");
    }

    const exam = attempt.exam;
    const now = new Date();
    const expiresAt = new Date(attempt.startedAt);
    expiresAt.setMinutes(expiresAt.getMinutes() + exam.timerMinutes);

    // Check if expired
    const isExpired = now > expiresAt;

    let status: AttemptStatus = AttemptStatus.SUBMITTED;
    if (isExpired) {
      status = AttemptStatus.TIMED_OUT;
    }

    const updated = await this.prisma.examAttempt.update({
      where: { id: attempt.id },
      data: {
        status,
        answers: dto.answers as any,
        submittedAt: now,
      },
    });

    const response = {
      attemptId: updated.id,
      status: updated.status,
      submittedAt: updated.submittedAt,
      isTimedOut: status === AttemptStatus.TIMED_OUT,
      message: isExpired
        ? "Exam submitted: timer expired"
        : "Exam submitted successfully",
    };

    await this.idempotencyService.markCompleted(
      tenantId,
      dto.idempotencyKey,
      response,
    );
    return response;
  }

  async getExamTimer(tenantId: string, userId: string, examId: string) {
    const attempt = await this.prisma.examAttempt.findFirst({
      where: {
        examId,
        studentId: userId,
        status: AttemptStatus.IN_PROGRESS,
      },
      include: { exam: true },
    });

    if (!attempt) {
      throw new NotFoundException("No active attempt found");
    }

    const exam = attempt.exam;
    const now = new Date();
    const expiresAt = new Date(attempt.startedAt);
    expiresAt.setMinutes(expiresAt.getMinutes() + exam.timerMinutes);
    const timeRemainingSeconds = Math.max(
      0,
      Math.floor((expiresAt.getTime() - now.getTime()) / 1000),
    );
    const isExpired = timeRemainingSeconds === 0;

    return {
      expiresAt,
      timeRemainingSeconds,
      isExpired,
      status: attempt.status,
    };
  }

  async getStudentExamAttempts(
    tenantId: string,
    userId: string,
    examId: string,
  ) {
    const attempts = await this.prisma.examAttempt.findMany({
      where: { examId, studentId: userId, tenantId },
      orderBy: { startedAt: "desc" },
      include: {
        exam: {
          select: { timerMinutes: true, passingScore: true, showResults: true },
        },
      },
    });

    return attempts.map((a) => {
      const expiresAt = new Date(a.startedAt);
      expiresAt.setMinutes(
        expiresAt.getMinutes() +
          (a.exam?.timerMinutes ?? this.DEFAULT_TIMER_MINUTES),
      );
      const now = new Date();
      const timeRemainingSeconds = Math.max(
        0,
        Math.floor((expiresAt.getTime() - now.getTime()) / 1000),
      );
      const isExpired = timeRemainingSeconds === 0;

      // Hide answers if showResults is false
      const showAnswers = a.exam?.showResults ?? true;

      return {
        ...a,
        answers: showAnswers ? a.answers : undefined,
        timeRemainingSeconds,
        isExpired,
      };
    });
  }

  // ==================== TEACHER GRADING ====================

  async getAttemptsForGrading(
    tenantId: string,
    examId: string,
    filters: { status?: AttemptStatus; cursor?: string; limit?: number },
  ) {
    const where: Prisma.ExamAttemptWhereInput = { examId, tenantId };
    if (filters.status) where.status = filters.status;

    const limit = filters.limit ?? 20;
    const attempts = await this.prisma.examAttempt.findMany({
      where,
      orderBy: { startedAt: "asc" }, // Oldest first for grading queue
      take: limit + 1,
      cursor: filters.cursor ? { id: filters.cursor } : undefined,
      include: {
        student: { select: { id: true, name: true, phone: true, email: true } },
        exam: {
          select: { timerMinutes: true, passingScore: true, maxAttempts: true },
        },
      },
    });

    let nextCursor: string | null = null;
    if (attempts.length > limit) {
      const next = attempts.pop();
      nextCursor = next!.id;
    }

    return {
      attempts: attempts.map((a) => {
        const expiresAt = new Date(a.startedAt);
        expiresAt.setMinutes(
          expiresAt.getMinutes() +
            (a.exam?.timerMinutes ?? this.DEFAULT_TIMER_MINUTES),
        );
        const now = new Date();
        const timeRemainingSeconds = Math.max(
          0,
          Math.floor((expiresAt.getTime() - now.getTime()) / 1000),
        );
        const isExpired = timeRemainingSeconds === 0;
        return {
          ...a,
          timeRemainingSeconds,
          isExpired,
        };
      }),
      nextCursor,
    };
  }

  // ==================== HELPER METHODS ====================

  private shuffleArray<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }
}
