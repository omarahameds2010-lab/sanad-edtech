import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  NotFoundException,
} from "@nestjs/common";
import { CoursesService } from "./courses.service";
import { SectionsService } from "./sections/sections.service";
import { LessonsService } from "./lessons/lessons.service";
import { EnrollmentsService } from "./enrollments/enrollments.service";
import { ResourcesService } from "./resources/resources.service";
import {
  CreateCourseRequest,
  UpdateCourseRequest,
} from "./dto/create-course.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RequirePermission } from "../authorization/authorization.decorators";

@Controller("api/v1/teacher/courses")
@UseGuards(JwtAuthGuard)
export class TeacherCoursesController {
  constructor(private coursesService: CoursesService) {}

  @Post()
  @RequirePermission({ action: "create", resourceType: "course" })
  @HttpCode(HttpStatus.CREATED)
  async createCourse(@Request() req, @Body() body) {
    const course = await this.coursesService.createCourse(
      req.tenantId,
      req.user.sub,
      body,
    );
    return { data: course };
  }

  @Get()
  @RequirePermission({ action: "read", resourceType: "course" })
  async listCourses(
    @Request() req,
    @Query("cursor") cursor?: string,
    @Query("limit") limit?: number,
    @Query("status") status?: string,
  ) {
    const result = await this.coursesService.getCourses(
      req.tenantId,
      cursor,
      limit,
      status,
    );
    return {
      data: result.courses,
      pagination: {
        hasNextPage: !!result.nextCursor,
        nextCursor: result.nextCursor,
      },
    };
  }

  @Get(":id")
  @RequirePermission({
    action: "read",
    resourceType: "course",
    resourceIdParam: "id",
  })
  async getCourse(@Request() req, @Param("id") id: string) {
    const course = await this.coursesService.getCourse(req.tenantId, id);
    return { data: course };
  }

  @Patch(":id")
  @RequirePermission({
    action: "update",
    resourceType: "course",
    resourceIdParam: "id",
  })
  async updateCourse(@Request() req, @Param("id") id: string, @Body() body) {
    const course = await this.coursesService.updateCourse(
      req.tenantId,
      id,
      body,
    );
    return { data: course };
  }

  @Delete(":id")
  @RequirePermission({
    action: "delete",
    resourceType: "course",
    resourceIdParam: "id",
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteCourse(@Request() req, @Param("id") id: string) {
    await this.coursesService.deleteCourse(req.tenantId, id);
  }

  @Post(":id/publish")
  @RequirePermission({
    action: "publish",
    resourceType: "course",
    resourceIdParam: "id",
  })
  async publishCourse(@Request() req, @Param("id") id: string) {
    const course = await this.coursesService.publishCourse(
      req.tenantId,
      id,
      req.user.sub,
    );
    return { data: course };
  }

  @Post(":id/unpublish")
  @RequirePermission({
    action: "publish",
    resourceType: "course",
    resourceIdParam: "id",
  })
  async unpublishCourse(@Request() req, @Param("id") id: string) {
    const course = await this.coursesService.unpublishCourse(req.tenantId, id);
    return { data: course };
  }

  @Post(":id/archive")
  @RequirePermission({
    action: "archive",
    resourceType: "course",
    resourceIdParam: "id",
  })
  async archiveCourse(@Request() req, @Param("id") id: string) {
    const course = await this.coursesService.archiveCourse(req.tenantId, id);
    return { data: course };
  }
}

@Controller("api/v1/public/courses")
export class PublicCoursesController {
  constructor(private coursesService: CoursesService) {}

  @Get()
  async listPublicCourses(
    @Request() req,
    @Query("cursor") cursor?: string,
    @Query("limit") limit?: number,
    @Query("search") search?: string,
  ) {
    const result = await this.coursesService.getPublicCourses(
      req.tenantId,
      cursor,
      limit,
      req.query.search,
    );
    return {
      data: result.courses,
      pagination: {
        hasNextPage: !!result.nextCursor,
        nextCursor: result.nextCursor,
      },
    };
  }

  @Get(":slug")
  async getPublicCourse(@Request() req, @Param("slug") slug: string) {
    const course = await this.coursesService.getPublicCourses(
      req.tenantId,
      undefined,
      1,
      slug,
    );
    if (!course || course.courses.length === 0) {
      throw new NotFoundException("Course not found");
    }
    return { data: course.courses[0] };
  }

  @Get(":slug/preview")
  async previewCourse(@Request() req, @Param("slug") slug: string) {
    const preview = await this.coursesService.getCoursePreview(
      req.tenantId,
      slug,
    );
    return { data: preview };
  }
}

@Controller("api/v1/teacher")
@UseGuards(JwtAuthGuard)
export class SectionsController {
  constructor(private sectionsService: SectionsService) {}

  @Post("courses/:courseId/sections")
  @RequirePermission({ action: "create", resourceType: "section" })
  @HttpCode(HttpStatus.CREATED)
  async createSection(
    @Request() req,
    @Param("courseId") courseId: string,
    @Body() body: any,
  ) {
    const section = await this.sectionsService.createSection(
      req.tenantId,
      courseId,
      body,
    );
    return { data: section };
  }

  @Get("courses/:courseId/sections")
  @RequirePermission({ action: "read", resourceType: "section" })
  async listSections(@Request() req, @Param("courseId") courseId: string) {
    const sections = await this.sectionsService.listSections(
      req.tenantId,
      courseId,
    );
    return { data: sections };
  }

  @Get("sections/:id")
  @RequirePermission({
    action: "read",
    resourceType: "section",
    resourceIdParam: "id",
  })
  async getSection(@Request() req, @Param("id") id: string) {
    const section = await this.sectionsService.getSection(req.tenantId, id);
    return { data: section };
  }

  @Patch("sections/:id")
  @RequirePermission({
    action: "update",
    resourceType: "section",
    resourceIdParam: "id",
  })
  async updateSection(
    @Request() req,
    @Param("id") id: string,
    @Body() body: any,
  ) {
    const section = await this.sectionsService.updateSection(
      req.tenantId,
      id,
      body,
    );
    return { data: section };
  }

  @Delete("sections/:id")
  @RequirePermission({
    action: "delete",
    resourceType: "section",
    resourceIdParam: "id",
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteSection(@Request() req, @Param("id") id: string) {
    await this.sectionsService.deleteSection(req.tenantId, id);
  }

  @Patch("courses/:courseId/sections/reorder")
  @RequirePermission({ action: "reorder", resourceType: "section" })
  async reorderSections(
    @Request() req,
    @Param("courseId") courseId: string,
    @Body() body: { items: { id: string; position: number }[] },
  ) {
    const sections = await this.sectionsService.reorderSections(
      req.tenantId,
      courseId,
      body.items,
    );
    return { data: sections };
  }
}

@Controller("api/v1/teacher")
@UseGuards(JwtAuthGuard)
export class TeacherLessonsController {
  constructor(private lessonsService: LessonsService) {}

  @Post("sections/:sectionId/lessons")
  @RequirePermission({ action: "create", resourceType: "lesson" })
  @HttpCode(HttpStatus.CREATED)
  async createLesson(
    @Request() req,
    @Param("sectionId") sectionId: string,
    @Body() body: any,
  ) {
    const lesson = await this.lessonsService.createLesson(
      req.tenantId,
      sectionId,
      body,
    );
    return { data: lesson };
  }

  @Get("sections/:sectionId/lessons")
  @RequirePermission({ action: "read", resourceType: "lesson" })
  async listLessons(@Request() req, @Param("sectionId") sectionId: string) {
    const lessons = await this.lessonsService.listLessons(
      req.tenantId,
      sectionId,
    );
    return { data: lessons };
  }

  @Get("lessons/:id")
  @RequirePermission({
    action: "read",
    resourceType: "lesson",
    resourceIdParam: "id",
  })
  async getLesson(@Request() req, @Param("id") id: string) {
    const lesson = await this.lessonsService.getLesson(req.tenantId, id);
    return { data: lesson };
  }

  @Patch("lessons/:id")
  @RequirePermission({
    action: "update",
    resourceType: "lesson",
    resourceIdParam: "id",
  })
  async updateLesson(
    @Request() req,
    @Param("id") id: string,
    @Body() body: any,
  ) {
    const lesson = await this.lessonsService.updateLesson(
      req.tenantId,
      id,
      body,
    );
    return { data: lesson };
  }

  @Delete("lessons/:id")
  @RequirePermission({
    action: "delete",
    resourceType: "lesson",
    resourceIdParam: "id",
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteLesson(@Request() req, @Param("id") id: string) {
    await this.lessonsService.deleteLesson(req.tenantId, id);
  }

  @Post("lessons/:id/publish")
  @RequirePermission({
    action: "publish",
    resourceType: "lesson",
    resourceIdParam: "id",
  })
  async publishLesson(@Request() req, @Param("id") id: string) {
    const lesson = await this.lessonsService.publishLesson(req.tenantId, id);
    return { data: lesson };
  }

  @Post("lessons/:id/unpublish")
  @RequirePermission({
    action: "publish",
    resourceType: "lesson",
    resourceIdParam: "id",
  })
  async unpublishLesson(@Request() req, @Param("id") id: string) {
    const lesson = await this.lessonsService.unpublishLesson(req.tenantId, id);
    return { data: lesson };
  }

  @Patch("sections/:sectionId/lessons/reorder")
  @RequirePermission({ action: "reorder", resourceType: "lesson" })
  async reorderLessons(
    @Request() req,
    @Param("sectionId") sectionId: string,
    @Body() body: { items: { id: string; position: number }[] },
  ) {
    const lessons = await this.lessonsService.reorderLessons(
      req.tenantId,
      sectionId,
      body.items,
    );
    return { data: lessons };
  }
}

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
  async getLesson(@Request() req, @Param("lessonId") lessonId: string) {
    const result = await this.lessonsService.getStudentLesson(
      req.tenantId,
      req.user.sub,
      lessonId,
    );
    return { data: result };
  }
}

@Controller("api/v1/teacher")
@UseGuards(JwtAuthGuard)
export class TeacherResourcesController {
  constructor(private resourcesService: ResourcesService) {}

  @Post("lessons/:lessonId/resources")
  @RequirePermission({ action: "create", resourceType: "lesson" })
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Request() req,
    @Param("lessonId") lessonId: string,
    @Body() body: any,
  ) {
    const resource = await this.resourcesService.createResource(
      req.tenantId,
      lessonId,
      body,
    );
    return { data: resource };
  }

  @Get("lessons/:lessonId/resources")
  @RequirePermission({ action: "read", resourceType: "lesson" })
  async list(@Request() req, @Param("lessonId") lessonId: string) {
    const resources = await this.resourcesService.listResources(
      req.tenantId,
      lessonId,
    );
    return { data: resources };
  }

  @Patch("resources/:id")
  @RequirePermission({
    action: "update",
    resourceType: "lesson",
    resourceIdParam: "id",
  })
  async update(@Request() req, @Param("id") id: string, @Body() body: any) {
    const resource = await this.resourcesService.updateResource(
      req.tenantId,
      id,
      body,
    );
    return { data: resource };
  }

  @Delete("resources/:id")
  @RequirePermission({
    action: "delete",
    resourceType: "lesson",
    resourceIdParam: "id",
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Request() req, @Param("id") id: string) {
    await this.resourcesService.deleteResource(req.tenantId, id);
  }
}

@Controller("api/v1/student/resources")
@UseGuards(JwtAuthGuard)
export class StudentResourcesController {
  constructor(private resourcesService: ResourcesService) {}

  @Post(":id/access-url")
  async accessUrl(@Request() req, @Param("id") id: string) {
    const result = await this.resourcesService.getAccessUrl(
      req.tenantId,
      req.user.sub,
      id,
    );
    return { data: result };
  }
}

@Controller("api/v1/student/enrollments")
@UseGuards(JwtAuthGuard)
export class StudentEnrollmentsController {
  constructor(private enrollmentsService: EnrollmentsService) {}

  @Post(":courseId")
  @HttpCode(HttpStatus.CREATED)
  async enroll(@Request() req, @Param("courseId") courseId: string) {
    const enrollment = await this.enrollmentsService.enroll(
      req.tenantId,
      req.user.sub,
      courseId,
    );
    return { data: enrollment };
  }

  @Get()
  async list(@Request() req, @Query("status") status?: string) {
    const enrollments = await this.enrollmentsService.listEnrollments(
      req.tenantId,
      req.user.sub,
      status,
    );
    return { data: enrollments };
  }

  @Get(":id")
  async get(@Request() req, @Param("id") id: string) {
    const enrollment = await this.enrollmentsService.getEnrollment(
      req.tenantId,
      req.user.sub,
      id,
    );
    return { data: enrollment };
  }

  @Post(":id/cancel")
  async cancel(@Request() req, @Param("id") id: string) {
    const enrollment = await this.enrollmentsService.cancelEnrollment(
      req.tenantId,
      req.user.sub,
      id,
    );
    return { data: enrollment };
  }
}
