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
import { AssignmentsService } from "./assignments.service";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { RequirePermission } from "../../authorization/authorization.decorators";

@Controller("v1/assignments")
@UseGuards(JwtAuthGuard)
export class AssignmentsController {
  constructor(private assignmentsService: AssignmentsService) {}

  @Post("lessons/:lessonId/assignments")
  @RequirePermission({
    action: "create",
    resourceType: "assignment",
    resourceIdParam: "lessonId",
  })
  async create(
    @Request() req,
    @Param("lessonId") lessonId: string,
    @Body() dto: any,
  ) {
    const result = await this.assignmentsService.createAssignment(
      req.tenantId,
      req.user.sub,
      lessonId,
      dto,
    );
    return { data: result };
  }

  @Patch(":assignmentId")
  @RequirePermission({
    action: "update",
    resourceType: "assignment",
    resourceIdParam: "assignmentId",
  })
  async update(
    @Request() req,
    @Param("assignmentId") assignmentId: string,
    @Body() dto: any,
  ) {
    const result = await this.assignmentsService.updateAssignment(
      req.tenantId,
      assignmentId,
      dto,
    );
    return { data: result };
  }

  @Post(":assignmentId/publish")
  @RequirePermission({
    action: "publish",
    resourceType: "assignment",
    resourceIdParam: "assignmentId",
  })
  async publish(@Request() req, @Param("assignmentId") assignmentId: string) {
    const result = await this.assignmentsService.publishAssignment(
      req.tenantId,
      assignmentId,
    );
    return { data: result };
  }

  @Get()
  @RequirePermission({ action: "read", resourceType: "assignment" })
  async list(@Request() req, @Query() query: any) {
    const result = await this.assignmentsService.listAssignments(req.tenantId, {
      lessonId: query.lessonId,
      status: query.status,
      cursor: query.cursor,
      limit: query.limit ? Number(query.limit) : undefined,
    });
    return { data: result };
  }

  @Get(":assignmentId")
  @RequirePermission({
    action: "read",
    resourceType: "assignment",
    resourceIdParam: "assignmentId",
  })
  async get(@Request() req, @Param("assignmentId") assignmentId: string) {
    const result = await this.assignmentsService.getAssignment(
      req.tenantId,
      assignmentId,
    );
    return { data: result };
  }

  @Get(":assignmentId/view")
  @RequirePermission({
    action: "read",
    resourceType: "assignment",
    resourceIdParam: "assignmentId",
  })
  async studentView(
    @Request() req,
    @Param("assignmentId") assignmentId: string,
  ) {
    const result = await this.assignmentsService.getStudentAssignmentView(
      req.tenantId,
      req.user.sub,
      assignmentId,
    );
    return { data: result };
  }

  @Post(":assignmentId/enter")
  @RequirePermission({
    action: "attempt",
    resourceType: "assignment",
    resourceIdParam: "assignmentId",
  })
  async enter(
    @Request() req,
    @Param("assignmentId") assignmentId: string,
    @Headers("idempotency-key") idempotencyKey: string,
  ) {
    const result = await this.assignmentsService.startAssignmentAttempt(
      req.tenantId,
      req.user.sub,
      assignmentId,
      idempotencyKey,
    );
    // Progression runs ONCE inside the service (audit 2026-10-16 §6.1 — the
    // controller used to call it a second time and always got 0 unlocks).
    // The ?? guard keeps pre-fix cached responses from breaking the web shape.
    const unlocked = result.unlocked ?? { unlocked: 0, lessonIds: [] };
    const attempt = {
      attemptId: result.attemptId,
      assignmentId: result.assignmentId,
      attemptNumber: result.attemptNumber ?? 1,
      startedAt: result.startedAt,
      expiresAt: result.expiresAt,
      timeRemainingSeconds: result.timeRemainingSeconds,
      timerMinutes: result.timerMinutes,
    };
    return { data: { attempt, unlocked } };
  }

  @Get(":assignmentId/timer")
  @RequirePermission({
    action: "read",
    resourceType: "assignment",
    resourceIdParam: "assignmentId",
  })
  async timer(@Request() req, @Param("assignmentId") assignmentId: string) {
    const result = await this.assignmentsService.getAssignmentTimer(
      req.tenantId,
      req.user.sub,
      assignmentId,
    );
    return { data: result };
  }

  @Get(":assignmentId/submissions/me")
  @RequirePermission({
    action: "read",
    resourceType: "assignment",
    resourceIdParam: "assignmentId",
  })
  async mySubmissions(
    @Request() req,
    @Param("assignmentId") assignmentId: string,
  ) {
    const result = await this.assignmentsService.getStudentSubmissions(
      req.tenantId,
      req.user.sub,
      assignmentId,
    );
    return { data: result };
  }

  @Post(":assignmentId/submit")
  @RequirePermission({
    action: "submit",
    resourceType: "assignment",
    resourceIdParam: "assignmentId",
  })
  async submit(
    @Request() req,
    @Param("assignmentId") assignmentId: string,
    @Body()
    body: { content?: string; attachments?: any[]; idempotencyKey?: string },
    @Headers("idempotency-key") headerKey: string,
  ) {
    const result = await this.assignmentsService.submitAssignment(
      req.tenantId,
      req.user.sub,
      assignmentId,
      {
        content: body.content,
        attachments: body.attachments,
        idempotencyKey: headerKey ?? body.idempotencyKey,
      },
    );
    return { data: result };
  }

  @Get(":assignmentId/submissions")
  @RequirePermission({
    action: "grade",
    resourceType: "assignment",
    resourceIdParam: "assignmentId",
  })
  async gradingQueue(
    @Request() req,
    @Param("assignmentId") assignmentId: string,
    @Query() query: any,
  ) {
    const result = await this.assignmentsService.getSubmissionsForGrading(
      req.tenantId,
      assignmentId,
      {
        status: query.status,
        cursor: query.cursor,
        limit: query.limit ? Number(query.limit) : undefined,
      },
    );
    return { data: result };
  }

  @Post("submissions/:submissionId/grade")
  @RequirePermission({ action: "grade", resourceType: "assignment" })
  async grade(
    @Request() req,
    @Param("submissionId") submissionId: string,
    @Body() body: { score: number; feedback?: string },
  ) {
    const result = await this.assignmentsService.gradeSubmission(
      req.tenantId,
      submissionId,
      req.user.sub,
      { score: body.score, feedback: body.feedback },
    );
    return { data: result };
  }

  @Post(":assignmentId/evaluate-ai")
  @RequirePermission({ action: "evaluate", resourceType: "assignment" })
  async evaluateWithAI(
    @Request() req,
    @Param("assignmentId") assignmentId: string,
    @Body()
    dto: {
      answer: string;
      question?: string;
      grading?: {
        reference_answer: string;
        max_score: number;
        rubric_version: string;
        criteria: { id: string; description: string; max_score: number }[];
      };
      sourceIds?: string[];
      branches?: string[];
    },
  ) {
    // Teacher dashboard sends the rubric + knowledge scope it displays.
    // SANAD grades against them; the official grade stays with
    // POST submissions/:submissionId/grade after teacher review.
    const result = await this.assignmentsService.evaluateAssignmentWithAI(
      req.tenantId,
      req.user.sub,
      assignmentId,
      dto.answer,
      dto.question,
      dto.grading,
      dto.sourceIds,
      dto.branches,
    );
    return { data: result };
  }

  @Post(":assignmentId/ask-sanad")
  @RequirePermission({ action: "evaluate", resourceType: "assignment" })
  async askSanad(
    @Request() req,
    @Param("assignmentId") assignmentId: string,
    @Body() dto: { question: string; branch?: string },
  ) {
    // Evidence explorer: pure extractive retrieval scoped server-side.
    // No LLM is called; the teacher/student gets library passages only.
    const result = await this.assignmentsService.askSanad(
      req.tenantId,
      assignmentId,
      dto.question,
      dto.branch,
    );
    return { data: result };
  }
}
