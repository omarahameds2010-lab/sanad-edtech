import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from "@nestjs/common";
import { ExamsService } from "./exams.service";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { RequirePermission } from "../../authorization/authorization.decorators";

@Controller("v1/exams")
@UseGuards(JwtAuthGuard)
export class ExamsController {
  constructor(private examsService: ExamsService) {}

  @Post("lessons/:lessonId/exams")
  @RequirePermission({
    action: "create",
    resourceType: "exam",
    resourceIdParam: "lessonId",
  })
  async create(
    @Request() req,
    @Param("lessonId") lessonId: string,
    @Body() dto: any,
  ) {
    const result = await this.examsService.createExam(
      req.tenantId,
      req.user.sub,
      lessonId,
      dto,
    );
    return { data: result };
  }

  @Patch(":examId")
  @RequirePermission({
    action: "update",
    resourceType: "exam",
    resourceIdParam: "examId",
  })
  async update(
    @Request() req,
    @Param("examId") examId: string,
    @Body() dto: any,
  ) {
    const result = await this.examsService.updateExam(
      req.tenantId,
      examId,
      dto,
    );
    return { data: result };
  }

  @Post(":examId/publish")
  @RequirePermission({
    action: "publish",
    resourceType: "exam",
    resourceIdParam: "examId",
  })
  async publish(@Request() req, @Param("examId") examId: string) {
    const result = await this.examsService.publishExam(req.tenantId, examId);
    return { data: result };
  }

  @Post(":examId/questions")
  @RequirePermission({
    action: "update",
    resourceType: "exam",
    resourceIdParam: "examId",
  })
  async addQuestion(
    @Request() req,
    @Param("examId") examId: string,
    @Body() dto: any,
  ) {
    const result = await this.examsService.addQuestion(
      req.tenantId,
      examId,
      dto,
    );
    return { data: result };
  }

  @Get()
  @RequirePermission({ action: "read", resourceType: "exam" })
  async list(@Request() req, @Query() query: any) {
    const result = await this.examsService.listExams(
      req.tenantId,
      {
        lessonId: query.lessonId,
        status: query.status,
        cursor: query.cursor,
        limit: query.limit ? Number(query.limit) : undefined,
      },
      {
        // Students and teachers share the index endpoint. Students receive
        // only navigation metadata; the full brief lives behind `/view`.
        studentSafe:
          req.user.role === "STUDENT" || req.user.role === "PARENT",
      },
    );
    return { data: result };
  }

  @Get(":examId")
  // Teacher/admin authoring read. `questions=true` and `attempts=true` expose
  // answer keys and every student's attempt, so this route must never be
  // reachable with the student `exam:read` grant. Students use `/view`,
  // `/timer`, and `/attempts/me`, which are scoped to the caller.
  @RequirePermission({
    action: "update",
    resourceType: "exam",
    resourceIdParam: "examId",
  })
  async get(
    @Request() req,
    @Param("examId") examId: string,
    @Query() query: any,
  ) {
    const result = await this.examsService.getExam(
      req.tenantId,
      examId,
      query.questions === "true",
      query.attempts === "true",
    );
    return { data: result };
  }

  @Get(":examId/view")
  @RequirePermission({
    action: "read",
    resourceType: "exam",
    resourceIdParam: "examId",
  })
  async studentView(@Request() req, @Param("examId") examId: string) {
    // Student-safe view: solutions never leave the server (service strips them)
    const result = await this.examsService.getStudentExamView(
      req.tenantId,
      req.user.sub,
      examId,
    );
    return { data: result };
  }

  @Post(":examId/enter")
  @RequirePermission({
    action: "attempt",
    resourceType: "exam",
    resourceIdParam: "examId",
  })
  async enter(
    @Request() req,
    @Param("examId") examId: string,
    @Headers("idempotency-key") idempotencyKey: string,
  ) {
    const result = await this.examsService.startExamAttempt(
      req.tenantId,
      req.user.sub,
      examId,
      idempotencyKey,
    );
    // Progression runs ONCE inside the service (audit 2026-10-16 §6.1 — the
    // controller used to call it a second time and always got 0 unlocks).
    // The ?? guard keeps pre-fix cached responses from breaking the web shape.
    const unlocked = result.unlocked ?? { unlocked: 0, lessonIds: [] };
    const attempt = {
      attemptId: result.attemptId,
      examId: result.examId,
      attemptNumber: result.attemptNumber,
      startedAt: result.startedAt,
      expiresAt: result.expiresAt,
      timeRemainingSeconds: result.timeRemainingSeconds,
      timerMinutes: result.timerMinutes,
      questions: result.questions,
    };
    return { data: { attempt, unlocked } };
  }

  @Get(":examId/timer")
  @RequirePermission({
    action: "read",
    resourceType: "exam",
    resourceIdParam: "examId",
  })
  async timer(@Request() req, @Param("examId") examId: string) {
    const result = await this.examsService.getExamTimer(
      req.tenantId,
      req.user.sub,
      examId,
    );
    return { data: result };
  }

  @Get(":examId/attempts/me")
  @RequirePermission({
    action: "read",
    resourceType: "exam",
    resourceIdParam: "examId",
  })
  async myAttempts(@Request() req, @Param("examId") examId: string) {
    const result = await this.examsService.getStudentExamAttempts(
      req.tenantId,
      req.user.sub,
      examId,
    );
    return { data: result };
  }

  @Post(":examId/submit")
  @RequirePermission({
    action: "submit",
    resourceType: "exam",
    resourceIdParam: "examId",
  })
  async submit(
    @Request() req,
    @Param("examId") examId: string,
    @Body() body: { answers: any; idempotencyKey?: string },
    @Headers("idempotency-key") headerKey: string,
  ) {
    const result = await this.examsService.submitExamAttempt(
      req.tenantId,
      req.user.sub,
      examId,
      {
        answers: body.answers,
        idempotencyKey: headerKey ?? body.idempotencyKey,
      },
    );
    return { data: result };
  }

  @Get(":examId/attempts/grading")
  @RequirePermission({
    action: "grade",
    resourceType: "exam",
    resourceIdParam: "examId",
  })
  async gradingQueue(
    @Request() req,
    @Param("examId") examId: string,
    @Query() query: any,
  ) {
    const result = await this.examsService.getAttemptsForGrading(
      req.tenantId,
      examId,
      {
        status: query.status,
        cursor: query.cursor,
        limit: query.limit ? Number(query.limit) : undefined,
      },
    );
    return { data: result };
  }

  @Post("attempts/:attemptId/grade")
  @RequirePermission({
    action: "grade",
    resourceType: "attempt",
    resourceIdParam: "attemptId",
  })
  async grade(
    @Request() req,
    @Param("attemptId") attemptId: string,
    @Body() body: { score: number; feedback?: string; gradingData?: any },
  ) {
    const result = await this.examsService.gradeExamAttempt(
      req.tenantId,
      attemptId,
      req.user.sub,
      {
        score: body.score,
        feedback: body.feedback,
        gradingData: body.gradingData,
      },
    );
    return { data: result };
  }
}
