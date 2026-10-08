import {
  Controller,
  Get,
  Patch,
  Post,
  Param,
  Body,
  UseGuards,
  Request,
} from "@nestjs/common";
import { ProgressService } from "./progress.service";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { RequirePermission } from "../../authorization/authorization.decorators";

@Controller("v1/student")
@UseGuards(JwtAuthGuard)
export class ProgressController {
  constructor(private progressService: ProgressService) {}

  @Get("courses/:courseId/progress")
  @RequirePermission({ action: "read", resourceType: "lesson" })
  async getCourseProgress(@Request() req, @Param("courseId") courseId: string) {
    const result = await this.progressService.getCourseProgress(
      req.tenantId,
      req.user.sub,
      courseId,
    );
    return { data: result };
  }

  @Get("lessons/:lessonId/progress")
  @RequirePermission({ action: "read", resourceType: "lesson" })
  async getLessonProgress(@Request() req, @Param("lessonId") lessonId: string) {
    const result = await this.progressService.getLessonProgress(
      req.tenantId,
      req.user.sub,
      lessonId,
    );
    return { data: result };
  }

  @Patch("lessons/:lessonId/progress")
  @RequirePermission({ action: "update", resourceType: "lesson" })
  async updateProgress(
    @Request() req,
    @Param("lessonId") lessonId: string,
    @Body() body: { positionSeconds: number; watchedSeconds?: number },
  ) {
    const result = await this.progressService.updateProgress(
      req.tenantId,
      req.user.sub,
      lessonId,
      body,
    );
    return { data: result };
  }

  @Post("lessons/:lessonId/complete")
  @RequirePermission({ action: "update", resourceType: "lesson" })
  async completeLesson(@Request() req, @Param("lessonId") lessonId: string) {
    const result = await this.progressService.completeLesson(
      req.tenantId,
      req.user.sub,
      lessonId,
    );
    return { data: result };
  }
}
