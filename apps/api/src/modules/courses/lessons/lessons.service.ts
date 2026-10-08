import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from "@nestjs/common";
import { PrismaService } from "../../tenants/prisma.service";
import { LessonType, VideoStatus } from "@prisma/client";

@Injectable()
export class LessonsService {
  constructor(private prisma: PrismaService) {}

  private slugify(title: string): string {
    return (
      title
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-") +
      "-" +
      Date.now().toString(36)
    );
  }

  async createLesson(
    tenantId: string,
    sectionId: string,
    dto: {
      title: string;
      type: LessonType;
      slug?: string;
      description?: string;
      videoId?: string;
      duration?: number;
      orderIndex?: number;
      isFree?: boolean;
      releaseAt?: Date;
    },
  ) {
    const section = await this.prisma.section.findFirst({
      where: { id: sectionId, tenantId },
    });
    if (!section) throw new NotFoundException("Section not found");

    let orderIndex = dto.orderIndex;
    if (orderIndex === undefined || orderIndex === null) {
      const max = await this.prisma.lesson.aggregate({
        where: { sectionId, tenantId },
        _max: { orderIndex: true },
      });
      orderIndex = (max._max.orderIndex ?? 0) + 1;
    }

    return this.prisma.lesson.create({
      data: {
        tenantId,
        sectionId,
        title: dto.title,
        type: dto.type,
        slug: dto.slug ?? this.slugify(dto.title),
        description: dto.description,
        videoId: dto.videoId,
        duration: dto.duration,
        orderIndex,
        isFree: dto.isFree ?? false,
        releaseAt: dto.releaseAt,
      },
    });
  }

  async listLessons(tenantId: string, sectionId: string) {
    const section = await this.prisma.section.findFirst({
      where: { id: sectionId, tenantId },
    });
    if (!section) throw new NotFoundException("Section not found");

    return this.prisma.lesson.findMany({
      where: { sectionId, tenantId },
      orderBy: { orderIndex: "asc" },
    });
  }

  async getLesson(tenantId: string, lessonId: string) {
    const lesson = await this.prisma.lesson.findFirst({
      where: { id: lessonId, tenantId },
      include: {
        section: { select: { id: true, courseId: true } },
        assignment: true,
        exam: true,
      },
    });
    if (!lesson) throw new NotFoundException("Lesson not found");
    return lesson;
  }

  async updateLesson(tenantId: string, lessonId: string, dto: any) {
    await this.getLesson(tenantId, lessonId);
    return this.prisma.lesson.update({
      where: { id: lessonId },
      data: {
        title: dto.title,
        description: dto.description,
        videoId: dto.videoId,
        duration: dto.duration,
        orderIndex: dto.orderIndex,
        isFree: dto.isFree,
        releaseAt: dto.releaseAt,
      },
    });
  }

  async deleteLesson(tenantId: string, lessonId: string) {
    await this.getLesson(tenantId, lessonId);
    await this.prisma.lesson.delete({ where: { id: lessonId } });
    return { success: true };
  }

  async publishLesson(tenantId: string, lessonId: string) {
    const lesson = await this.getLesson(tenantId, lessonId);
    if (lesson.status === "PUBLISHED") return lesson;
    return this.prisma.lesson.update({
      where: { id: lessonId },
      data: { status: "PUBLISHED", publishedAt: new Date() },
    });
  }

  async unpublishLesson(tenantId: string, lessonId: string) {
    await this.getLesson(tenantId, lessonId);
    return this.prisma.lesson.update({
      where: { id: lessonId },
      data: { status: "DRAFT" },
    });
  }

  async reorderLessons(
    tenantId: string,
    sectionId: string,
    items: { id: string; position: number }[],
  ) {
    const lessons = await this.prisma.lesson.findMany({
      where: { sectionId, tenantId },
    });
    const lessonIds = new Set(lessons.map((l) => l.id));

    for (const item of items) {
      if (!lessonIds.has(item.id)) {
        throw new BadRequestException(
          `Lesson ${item.id} does not belong to this section`,
        );
      }
    }

    await this.prisma.$transaction(
      items.map((item) =>
        this.prisma.lesson.update({
          where: { id: item.id },
          data: { orderIndex: item.position },
        }),
      ),
    );

    return this.listLessons(tenantId, sectionId);
  }

  /**
   * Student access check: enrollment required + lock status is server-calculated.
   */
  async getStudentLesson(tenantId: string, userId: string, lessonId: string) {
    const lesson = await this.prisma.lesson.findFirst({
      where: { id: lessonId, tenantId },
      include: {
        section: { select: { courseId: true } },
        assignment: {
          select: { id: true, title: true, timerMinutes: true, status: true },
        },
        exam: {
          select: { id: true, title: true, timerMinutes: true, status: true },
        },
        // Only watchable videos reach the student (no uploads/failures).
        videos: {
          where: { status: { in: [VideoStatus.READY, VideoStatus.PUBLISHED] } },
          select: {
            id: true,
            title: true,
            provider: true,
            providerVideoId: true,
            status: true,
            duration: true,
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!lesson) throw new NotFoundException("Lesson not found");

    const enrollment = await this.prisma.enrollment.findFirst({
      where: {
        userId,
        courseId: lesson.section.courseId,
        tenantId,
        status: "ACTIVE",
      },
    });

    if (!enrollment && !lesson.isFree) {
      throw new ForbiddenException("Not enrolled in this course");
    }

    const isLocked = lesson.lockStatus === "LOCKED";

    return {
      lesson: {
        id: lesson.id,
        title: lesson.title,
        type: lesson.type,
        description: lesson.description,
        duration: lesson.duration,
        orderIndex: lesson.orderIndex,
        status: lesson.status,
      },
      access: {
        isLocked,
        unlockType: lesson.unlockType,
        lockStatus: lesson.lockStatus,
      },
      assignment: lesson.assignment ?? null,
      exam: lesson.exam ?? null,
      videos: lesson.videos ?? [],
    };
  }
}
