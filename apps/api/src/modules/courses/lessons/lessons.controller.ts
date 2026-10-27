import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Request,
  UseGuards,
} from "@nestjs/common";
import { LessonsService } from "./lessons.service";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { RequirePermission } from "../../authorization/authorization.decorators";

@Controller("api/v1/student/lessons")
@UseGuards(JwtAuthGuard)
export class StudentLessonsController {
  constructor(private lessonsService: LessonsService) {}

  @Get(":lessonId")
  @RequirePermission({
    action: "read",
    resourceType: "lesson",
    resourceIdParam: "lessonId",
  })
  async studentView(@Request() req, @Param("lessonId") lessonId: string) {
    // Server-computed view: lesson + lock state + linked assignment/exam + watchable videos.
    // Enrollment enforced inside the service (403 unless enrolled or lesson is free).
    const result = await this.lessonsService.getStudentLesson(
      req.tenantId,
      req.user.sub,
      lessonId,
    );
    return { data: result };
  }
}

@Controller("api/v1/lessons")
@UseGuards(JwtAuthGuard)
export class LessonsController {
  constructor(private lessonsService: LessonsService) {}

  @Post("sections/:sectionId/lessons")
  @RequirePermission({
    action: "create",
    resourceType: "lesson",
    resourceIdParam: "sectionId",
  })
  async create(
    @Request() req,
    @Param("sectionId") sectionId: string,
    @Body() dto: any,
  ) {
    const result = await this.lessonsService.createLesson(
      req.tenantId,
      sectionId,
      dto,
    );
    return { data: result };
  }

  @Get("sections/:sectionId/lessons")
  // Legacy duplicate of the teacher lesson surface. It exposes linked
  // assignment/exam rows, so it is authoring-only (not `lesson:read`).
  @RequirePermission({
    action: "update",
    resourceType: "lesson",
    resourceIdParam: "sectionId",
  })
  async list(@Request() req, @Param("sectionId") sectionId: string) {
    const result = await this.lessonsService.listLessons(
      req.tenantId,
      sectionId,
    );
    return { data: result };
  }

  @Get(":lessonId")
  // Authoring-only for the same reason as the teacher lesson route. Students
  // must use the student controller, which enforces the progression grant.
  @RequirePermission({
    action: "update",
    resourceType: "lesson",
    resourceIdParam: "lessonId",
  })
  async get(@Request() req, @Param("lessonId") lessonId: string) {
    const result = await this.lessonsService.getLesson(req.tenantId, lessonId);
    return { data: result };
  }

  @Patch(":lessonId")
  @RequirePermission({
    action: "update",
    resourceType: "lesson",
    resourceIdParam: "lessonId",
  })
  async update(
    @Request() req,
    @Param("lessonId") lessonId: string,
    @Body() dto: any,
  ) {
    const result = await this.lessonsService.updateLesson(
      req.tenantId,
      lessonId,
      dto,
    );
    return { data: result };
  }

  @Delete(":lessonId")
  @RequirePermission({
    action: "delete",
    resourceType: "lesson",
    resourceIdParam: "lessonId",
  })
  async remove(@Request() req, @Param("lessonId") lessonId: string) {
    const result = await this.lessonsService.deleteLesson(
      req.tenantId,
      lessonId,
    );
    return { data: result };
  }

  @Post(":lessonId/publish")
  @RequirePermission({
    action: "publish",
    resourceType: "lesson",
    resourceIdParam: "lessonId",
  })
  async publish(@Request() req, @Param("lessonId") lessonId: string) {
    const result = await this.lessonsService.publishLesson(
      req.tenantId,
      lessonId,
    );
    return { data: result };
  }

  @Post(":lessonId/unpublish")
  @RequirePermission({
    action: "unpublish",
    resourceType: "lesson",
    resourceIdParam: "lessonId",
  })
  async unpublish(@Request() req, @Param("lessonId") lessonId: string) {
    const result = await this.lessonsService.unpublishLesson(
      req.tenantId,
      lessonId,
    );
    return { data: result };
  }

  @Post("sections/:sectionId/reorder")
  @RequirePermission({
    action: "update",
    resourceType: "lesson",
    resourceIdParam: "sectionId",
  })
  async reorder(
    @Request() req,
    @Param("sectionId") sectionId: string,
    @Body() body: { items: { id: string; position: number }[] },
  ) {
    const result = await this.lessonsService.reorderLessons(
      req.tenantId,
      sectionId,
      body.items,
    );
    return { data: result };
  }
}
