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
import { ProgressionService } from "../progression/progression.service";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { RequirePermission } from "../../authorization/authorization.decorators";

@Controller("v1/assignments")
@UseGuards(JwtAuthGuard)
export class AssignmentsController {
  constructor(
    private assignmentsService: AssignmentsService,
    private progressionService: ProgressionService,
  ) {}

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
  async publish(
    @Request() req,
    @Param("assignmentId") assignmentId: string,
  ) {
    const result = await this.assignmentsService.publishAssignment(
      req.tenantId,
      assignmentId,
    );
    return { data: result };
  }

  @Get()
  @RequirePermission({ action: "read", resourceType: "assignment" })
  async list(@Request() req, @Query() query: any) {
    const result = await this.assignmentsService.listAssignments(
      req.tenantId,
      {
        lessonId: query.lessonId,
        status: query.status,
        cursor: query.cursor,
        limit: query.limit ? Number(query.limit) : undefined,
      },
    );
    return { data: result };
  }

  @Get(":assignmentId")
  @RequirePermission({
    action: "read",
    resourceType: "assignment",
    resourceIdParam: "assignmentId",
  })
  async get(
    @Request() req,
    @Param("assignmentId") assignmentId: string,
  ) {
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
    @Body() body: { lessonId: string },
    @Headers("idempotency-key") idempotencyKey: string,
  ) {
    const attempt = await this.assignmentsService.startAssignmentAttempt(
      req.tenantId,
      req.user.sub,
      assignmentId,
      idempotencyKey,
    );
    // ENTER_ASSIGNMENT → unlock linked exam (idempotent progression event)
    const unlocked = await this.progressionService.handleEnterAssignment(
      req.tenantId,
      req.user.sub,
      assignmentId,
      body.lessonId,
      idempotencyKey,
    );
    return { data: { attempt, unlocked } };
  }

  @Get(":assignmentId/timer")
  @RequirePermission({
    action: "read",
    resourceType: "assignment",
    resourceIdParam: "assignmentId",
  })
  async timer(
    @Request() req,
    @Param("assignmentId") assignmentId: string,
  ) {
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
    @Body() body: { content?: string; attachments?: any[]; idempotencyKey?: string },
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
    @Body() dto: { answer: string; question?: string },
  ) {
    // Call SANAD AI engine for evaluation
    // In dev mode (no API keys), uses HashEmbedding + FakeLLM
    // In production, uses real embedding model + Gemini/Anthropic
    const result = await this.assignmentsService.evaluateAssignmentWithAI(
      req.tenantId,
      req.user.sub,
      assignmentId,
      dto.answer,
      dto.question,
    );
    return { data: result };
  }
}
