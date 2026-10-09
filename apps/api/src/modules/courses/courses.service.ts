import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from "@nestjs/common";
import { PrismaService } from "../tenants/prisma.service";
import { CreateCourseRequest } from "./dto/create-course.dto";
import { UpdateCourseRequest } from "./dto/create-course.dto";
import { CourseStatus } from "@prisma/client";
import { Prisma } from "@prisma/client";

const courseSelect = {
  id: true,
  title: true,
  slug: true,
  shortDescription: true,
  description: true,
  thumbnailUrl: true,
  visibility: true,
  level: true,
  language: true,
  price: true,
  currency: true,
  status: true,
  publishedAt: true,
  createdAt: true,
  updatedAt: true,
} as const;

const courseWithSectionsSelect = {
  ...courseSelect,
  sections: {
    include: {
      lessons: {
        where: { status: "PUBLISHED" },
        select: { id: true },
      },
    },
  },
} as const;

const coursePreviewSelect = {
  ...courseSelect,
  sections: {
    where: {
      lessons: {
        some: { status: "PUBLISHED" },
      },
    },
    include: {
      lessons: {
        where: { status: "PUBLISHED" },
        orderBy: { orderIndex: "asc" },
        select: {
          id: true,
          title: true,
          type: true,
          orderIndex: true,
          duration: true,
        },
      },
    },
  },
} as const;

const courseListSelect = {
  id: true,
  title: true,
  slug: true,
  shortDescription: true,
  description: true,
  thumbnailUrl: true,
  visibility: true,
  level: true,
  language: true,
  price: true,
  currency: true,
  status: true,
  createdAt: true,
  updatedAt: true,
} as const;

const coursePublicSelect = {
  id: true,
  title: true,
  slug: true,
  shortDescription: true,
  description: true,
  thumbnailUrl: true,
  visibility: true,
  level: true,
  language: true,
  price: true,
  currency: true,
  createdAt: true,
  updatedAt: true,
} as const;

@Injectable()
export class CoursesService {
  constructor(private prisma: PrismaService) {}

  async createCourse(
    tenantId: string,
    userId: string,
    input: CreateCourseRequest,
  ) {
    // Check if slug is already taken in this tenant
    const existingCourse = await this.prisma.course.findUnique({
      where: {
        tenantId_slug: {
          tenantId,
          slug: input.slug,
        },
      },
    });

    if (existingCourse) {
      throw new ConflictException("Course with this slug already exists");
    }

    const course = await this.prisma.course.create({
      data: {
        tenantId,
        title: input.title,
        slug: input.slug,
        shortDescription: input.shortDescription,
        description: input.description,
        thumbnailUrl: input.thumbnailUrl,
        visibility: input.visibility,
        level: input.level,
        language: input.language,
        price: input.price ?? 0,
        currency: input.currency || "EGP",
        status: CourseStatus.DRAFT,
      },
    });

    return course;
  }

  async getCourse(tenantId: string, courseId: string) {
    const course = await this.prisma.course.findFirst({
      where: { id: courseId, tenantId },
      select: courseSelect,
    });

    if (!course) {
      throw new NotFoundException("Course not found");
    }

    return course;
  }

  async getCourses(
    tenantId: string,
    cursor?: string,
    limit = 20,
    status?: string,
  ) {
    const where: Prisma.CourseWhereInput = { tenantId };
    if (status) {
      where.status = status as any;
    }

    const courses = await this.prisma.course.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit + 1,
      cursor: cursor ? { id: cursor } : undefined,
      select: courseListSelect,
    });

    let nextCursor: string | null = null;
    if (courses.length > limit) {
      const nextCourse = courses.pop();
      nextCursor = nextCourse!.id;
    }

    return { courses, nextCursor };
  }

  async updateCourse(
    tenantId: string,
    courseId: string,
    input: UpdateCourseRequest,
  ) {
    // Check if course exists and belongs to tenant
    const course = await this.prisma.course.findFirst({
      where: { id: courseId, tenantId },
    });

    if (!course) {
      throw new NotFoundException("Course not found");
    }

    // Check slug uniqueness if being updated
    if (input.slug && input.slug !== course.slug) {
      const existingCourse = await this.prisma.course.findUnique({
        where: {
          tenantId_slug: {
            tenantId,
            slug: input.slug,
          },
        },
      });

      if (existingCourse) {
        throw new ConflictException("Course with this slug already exists");
      }
    }

    const updatedCourse = await this.prisma.course.update({
      where: { id: courseId },
      data: {
        title: input.title,
        slug: input.slug,
        shortDescription: input.shortDescription,
        description: input.description,
        thumbnailUrl: input.thumbnailUrl,
        visibility: input.visibility,
        level: input.level,
        language: input.language,
        price: input.price,
        currency: input.currency,
      },
    });

    return updatedCourse;
  }

  async deleteCourse(tenantId: string, courseId: string) {
    const course = await this.prisma.course.findFirst({
      where: { id: courseId, tenantId },
    });

    if (!course) {
      throw new NotFoundException("Course not found");
    }

    // Archive instead of hard delete
    await this.prisma.course.update({
      where: { id: courseId },
      data: { status: "ARCHIVED" },
    });

    return { success: true };
  }

  async publishCourse(tenantId: string, courseId: string, userId: string) {
    const course = await this.prisma.course.findFirst({
      where: { id: courseId, tenantId },
      include: {
        sections: {
          include: {
            lessons: {
              where: { status: "PUBLISHED" },
              select: { id: true },
            },
          },
        },
      },
    });

    if (!course) {
      throw new NotFoundException("Course not found");
    }

    if (course.status === "PUBLISHED") {
      return course; // Already published
    }

    // Validation for publishing
    const errors: string[] = [];

    if (!course.title?.trim()) {
      errors.push("Course must have a title");
    }

    if (!course.shortDescription?.trim()) {
      errors.push("Course must have a short description");
    }

    if (!course.thumbnailUrl) {
      errors.push("Course must have a thumbnail");
    }

    if (!course.sections || course.sections.length === 0) {
      errors.push("Course must have at least one section");
    }

    const hasPublishedLesson = course.sections.some(
      (section) => section.lessons && section.lessons.length > 0,
    );

    if (!hasPublishedLesson) {
      errors.push("Course must have at least one published lesson");
    }

    if (course.price && Number(course.price) > 0 && !course.currency) {
      errors.push("Paid course must have a valid currency");
    }

    if (errors.length > 0) {
      throw new BadRequestException({
        message: "Course cannot be published",
        errors,
      });
    }

    const publishedCourse = await this.prisma.course.update({
      where: { id: courseId },
      data: {
        status: "PUBLISHED",
        publishedAt: new Date(),
      },
    });

    return publishedCourse;
  }

  async unpublishCourse(tenantId: string, courseId: string) {
    const course = await this.prisma.course.findFirst({
      where: { id: courseId, tenantId },
    });

    if (!course) {
      throw new NotFoundException("Course not found");
    }

    const updatedCourse = await this.prisma.course.update({
      where: { id: courseId },
      data: { status: "UNPUBLISHED" },
    });

    return updatedCourse;
  }

  async archiveCourse(tenantId: string, courseId: string) {
    const course = await this.prisma.course.findFirst({
      where: { id: courseId, tenantId },
    });

    if (!course) {
      throw new NotFoundException("Course not found");
    }

    const archivedCourse = await this.prisma.course.update({
      where: { id: courseId },
      data: { status: "ARCHIVED" },
    });

    return archivedCourse;
  }

  async getPublicCourses(
    tenantId: string,
    cursor?: string,
    limit = 20,
    search?: string,
  ) {
    const where: any = {
      tenantId,
      status: "PUBLISHED",
      visibility: "PUBLIC",
    };

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { shortDescription: { contains: search, mode: "insensitive" } },
      ];
    }

    const courses = await this.prisma.course.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit + 1,
      cursor: cursor ? { id: cursor } : undefined,
      select: {
        id: true,
        title: true,
        slug: true,
        shortDescription: true,
        description: true,
        thumbnailUrl: true,
        visibility: true,
        level: true,
        language: true,
        price: true,
        currency: true,
        teacher: {
          select: { name: true },
        },
      },
    });

    let nextCursor: string | null = null;
    if (courses.length > limit) {
      const nextCourse = courses.pop();
      nextCursor = nextCourse!.id;
    }

    return { courses, nextCursor };
  }

  async getCoursePreview(tenantId: string, slug: string) {
    const course = await this.prisma.course.findFirst({
      where: { tenantId, slug, status: "PUBLISHED", visibility: "PUBLIC" },
      include: {
        sections: {
          where: {
            lessons: {
              some: { status: "PUBLISHED" },
            },
          },
          include: {
            lessons: {
              where: { status: "PUBLISHED" },
              orderBy: { orderIndex: "asc" },
              select: {
                id: true,
                title: true,
                type: true,
                orderIndex: true,
                duration: true,
              },
            },
          },
          orderBy: { orderIndex: "asc" },
        },
      },
    });

    if (!course) {
      throw new NotFoundException("Course not found");
    }

    return {
      course: {
        id: course.id,
        title: course.title,
        slug: course.slug,
        shortDescription: course.shortDescription,
        description: course.description,
        thumbnailUrl: course.thumbnailUrl,
        visibility: course.visibility,
        level: course.level,
        language: course.language,
        price: course.price,
        currency: course.currency,
        teacher: { name: "" }, // Would need to fetch teacher name
      },
      previewLessons: course.sections.flatMap((section) =>
        section.lessons.map((lesson) => ({
          id: lesson.id,
          title: lesson.title,
          type: "VIDEO", // Would need actual type
          position: lesson.orderIndex,
          durationSeconds: lesson.duration,
        })),
      ),
    };
  }

  /**
   * Full curriculum structure for course detail pages.
   * Public variant shows published content only; the student variant
   * additionally requires an ACTIVE enrollment and exposes lock states.
   */
  async getCourseStructureBySlug(tenantId: string, slug: string) {
    const course = await this.prisma.course.findFirst({
      where: { tenantId, slug, status: "PUBLISHED" },
      select: { id: true },
    });
    if (!course) {
      throw new NotFoundException("Course not found");
    }
    return this.buildCourseStructure(tenantId, course.id);
  }

  async getCourseStructureForStudent(
    tenantId: string,
    courseId: string,
    userId: string,
  ) {
    const enrollment = await this.prisma.enrollment.findFirst({
      where: { tenantId, userId, courseId, status: "ACTIVE" },
    });
    if (!enrollment) {
      throw new ForbiddenException("Not enrolled in this course");
    }
    return this.buildCourseStructure(tenantId, courseId);
  }

  private async buildCourseStructure(tenantId: string, courseId: string) {
    const course = await this.prisma.course.findFirst({
      where: { id: courseId, tenantId },
      select: {
        id: true,
        title: true,
        slug: true,
        shortDescription: true,
        description: true,
        thumbnailUrl: true,
        visibility: true,
        level: true,
        language: true,
        price: true,
        currency: true,
        status: true,
        teacher: { select: { name: true } },
      },
    });
    if (!course) {
      throw new NotFoundException("Course not found");
    }
    const sections = await this.prisma.section.findMany({
      where: { tenantId, courseId },
      include: {
        lessons: {
          where: { status: "PUBLISHED" },
          select: {
            id: true,
            title: true,
            type: true,
            orderIndex: true,
            duration: true,
            lockStatus: true,
            unlockType: true,
          },
          orderBy: { orderIndex: "asc" },
        },
      },
      orderBy: { orderIndex: "asc" },
    });
    return { course, sections };
  }
}
