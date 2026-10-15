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
import { ProgressionService } from "../progression/progression.service";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { RequirePermission } from "../../authorization/authorization.decorators";

@Controller("v1/exams")
@UseGuards(JwtAuthGuard)
export class ExamsController {
  constructor(
    private examsService: ExamsService,
    private progressionService: ProgressionService,
  ) {}

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
    const result = await this.examsService.listExams(req.tenantId, {
      lessonId: query.lessonId,
      status: query.status,
      cursor: query.cursor,
      limit: query.limit ? Number(query.limit) : undefined,
    });
    return { data: result };
  }

  @Get(":examId")
  @RequirePermission({
    action: "read",
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
    @Body() body: { lessonId: string },
    @Headers("idempotency-key") idempotencyKey: string,
  ) {
    const attempt = await this.examsService.startExamAttempt(
      req.tenantId,
      req.user.sub,
      examId,
      idempotencyKey,
    );
    // ENTER_EXAM → unlock next lesson (idempotent progression event)
    const unlocked = await this.progressionService.handleEnterExam(
      req.tenantId,
      req.user.sub,
      examId,
      body.lessonId,
      idempotencyKey,
    );
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
      { answers: body.answers, idempotencyKey: headerKey ?? body.idempotencyKey },
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
