import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from "@nestjs/common";
import { PrismaService } from "../../tenants/prisma.service";

@Injectable()
export class ProgressService {
  constructor(private prisma: PrismaService) {}

  /**
   * Shared guard: verify the student has access to the lesson's course.
   */
  private async assertAccess(
    tenantId: string,
    userId: string,
    lessonId: string,
  ) {
    const lesson = await this.prisma.lesson.findFirst({
      where: { id: lessonId, tenantId },
      include: { section: { select: { courseId: true } } },
    });

    if (!lesson) throw new NotFoundException("Lesson not found");

    if (lesson.isFree) return lesson;

    const enrollment = await this.prisma.enrollment.findFirst({
      where: {
        tenantId,
        userId,
        courseId: lesson.section.courseId,
        status: "ACTIVE",
      },
    });

    if (!enrollment)
      throw new ForbiddenException("Not enrolled in this course");

    return lesson;
  }

  async getLessonProgress(tenantId: string, userId: string, lessonId: string) {
    await this.assertAccess(tenantId, userId, lessonId);

    const progress = await this.prisma.lessonProgress.findUnique({
      where: { tenantId_userId_lessonId: { tenantId, userId, lessonId } },
    });

    if (!progress) {
      return {
        lessonId,
        watchedSeconds: 0,
        lastPosition: null,
        completed: false,
        completedAt: null,
      };
    }

    return {
      lessonId: progress.lessonId,
      watchedSeconds: progress.watchedSeconds,
      lastPosition: progress.lastPosition,
      completed: progress.completedAt !== null,
      completedAt: progress.completedAt,
    };
  }

  async getCourseProgress(tenantId: string, userId: string, courseId: string) {
    const enrollment = await this.prisma.enrollment.findFirst({
      where: { tenantId, userId, courseId, status: "ACTIVE" },
    });

    if (!enrollment)
      throw new ForbiddenException("Not enrolled in this course");

    const lessons = await this.prisma.lesson.findMany({
      where: { tenantId, section: { courseId } },
      select: { id: true },
    });

    const progress = await this.prisma.lessonProgress.findMany({
      where: { tenantId, userId, lessonId: { in: lessons.map((l) => l.id) } },
    });

    const total = lessons.length;
    const completed = progress.filter((p) => p.completedAt !== null).length;
    const watchedSeconds = progress.reduce(
      (sum, p) => sum + p.watchedSeconds,
      0,
    );

    return {
      courseId,
      totalLessons: total,
      completedLessons: completed,
      progressPercent: total === 0 ? 0 : Math.round((completed / total) * 100),
      totalWatchedSeconds: watchedSeconds,
      completed: completed > 0 && completed === total,
      lastActivityAt:
        progress.length > 0
          ? new Date(Math.max(...progress.map((p) => p.updatedAt.getTime())))
          : null,
    };
  }

  /**
   * Heartbeat / progress update. The client only sends position + watchedSeconds;
   * `completed` is always server-derived.
   */
  async updateProgress(
    tenantId: string,
    userId: string,
    lessonId: string,
    dto: { positionSeconds: number; watchedSeconds?: number },
  ) {
    if (typeof dto.positionSeconds !== "number" || dto.positionSeconds < 0) {
      throw new BadRequestException(
        "positionSeconds must be a non-negative number",
      );
    }

    const lesson = await this.assertAccess(tenantId, userId, lessonId);

    // Server-side logical validation: never trust client progressPercent/completed
    let position = Math.floor(dto.positionSeconds);
    if (lesson.duration && position > lesson.duration) {
      position = lesson.duration;
    }

    const existing = await this.prisma.lessonProgress.findUnique({
      where: { tenantId_userId_lessonId: { tenantId, userId, lessonId } },
    });

    // watchedSeconds is monotonic — never let it go backwards
    const watched = Math.max(
      existing?.watchedSeconds ?? 0,
      dto.watchedSeconds ?? 0,
    );

    const progress = await this.prisma.lessonProgress.upsert({
      where: { tenantId_userId_lessonId: { tenantId, userId, lessonId } },
      create: {
        tenantId,
        userId,
        lessonId,
        watchedSeconds: watched,
        lastPosition: position,
      },
      update: {
        watchedSeconds: watched,
        lastPosition: position,
      },
    });

    return {
      lessonId: progress.lessonId,
      watchedSeconds: progress.watchedSeconds,
      lastPosition: progress.lastPosition,
      completed: progress.completedAt !== null,
      completedAt: progress.completedAt,
    };
  }

  async completeLesson(tenantId: string, userId: string, lessonId: string) {
    await this.assertAccess(tenantId, userId, lessonId);

    const progress = await this.prisma.lessonProgress.upsert({
      where: { tenantId_userId_lessonId: { tenantId, userId, lessonId } },
      create: { tenantId, userId, lessonId, completedAt: new Date() },
      update: { completedAt: new Date() },
    });

    return {
      lessonId: progress.lessonId,
      watchedSeconds: progress.watchedSeconds,
      lastPosition: progress.lastPosition,
      completed: true,
      completedAt: progress.completedAt,
    };
  }
}
