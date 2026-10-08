import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Request,
  UseGuards,
} from "@nestjs/common";
import { ProgressionService } from "./progression.service";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { RequirePermission } from "../../authorization/authorization.decorators";

@Controller("api/v1/progression")
@UseGuards(JwtAuthGuard)
export class ProgressionController {
  constructor(private progressionService: ProgressionService) {}

  @Get("courses/:courseId")
  @RequirePermission({
    action: "read",
    resourceType: "course",
    resourceIdParam: "courseId",
  })
  async studentProgression(
    @Request() req,
    @Param("courseId") courseId: string,
  ) {
    const result = await this.progressionService.getStudentProgression(
      req.tenantId,
      req.user.sub,
      courseId,
    );
    return { data: result };
  }

  @Get("lessons/:lessonId/next")
  @RequirePermission({
    action: "read",
    resourceType: "lesson",
    resourceIdParam: "lessonId",
  })
  async nextLesson(
    @Request() req,
    @Param("lessonId") lessonId: string,
  ) {
    const result = await this.progressionService.getNextLesson(
      req.tenantId,
      lessonId,
    );
    return { data: result };
  }

  @Post("lessons/:lessonId/unlock")
  @RequirePermission({
    action: "manage",
    resourceType: "lesson",
    resourceIdParam: "lessonId",
  })
  async manualUnlock(
    @Request() req,
    @Param("lessonId") lessonId: string,
    @Body() body: { reason?: string },
  ) {
    const result = await this.progressionService.manuallyUnlockLesson(
      req.tenantId,
      req.user.sub,
      lessonId,
      body.reason,
    );
    return { data: result };
  }

  @Post("lessons/:lessonId/reset")
  @RequirePermission({
    action: "manage",
    resourceType: "lesson",
    resourceIdParam: "lessonId",
  })
  async resetLock(@Request() req, @Param("lessonId") lessonId: string) {
    const result = await this.progressionService.resetLessonLock(
      req.tenantId,
      req.user.sub,
      lessonId,
    );
    return { data: result };
  }
}
