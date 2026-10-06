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
} from '@nestjs/common';
import { CoursesService } from './courses.service';
import { CreateCourseRequest, UpdateCourseRequest } from './dto/create-course.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RequirePermission } from '../authorization/authorization.decorators';

@Controller('api/v1/teacher/courses')
@UseGuards(JwtAuthGuard)
export class TeacherCoursesController {
  constructor(private coursesService: CoursesService) {}

  @Post()
  @RequirePermission({ action: 'create', resourceType: 'course' })
  @HttpCode(HttpStatus.CREATED)
  async createCourse(@Request() req, @Body() body) {
    const course = await this.coursesService.createCourse(req.tenantId, req.user.sub, body);
    return { data: course };
  }

  @Get()
  @RequirePermission({ action: 'read', resourceType: 'course' })
  async listCourses(
    @Request() req,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: number,
    @Query('status') status?: string,
  ) {
    const result = await this.coursesService.getCourses(req.tenantId, cursor, limit, status);
    return {
      data: result.courses,
      pagination: { hasNextPage: !!result.nextCursor, nextCursor: result.nextCursor },
    };
  }

  @Get(':id')
  @RequirePermission({ action: 'read', resourceType: 'course', resourceIdParam: 'id' })
  async getCourse(@Request() req, @Param('id') id: string) {
    const course = await this.coursesService.getCourse(req.tenantId, id);
    return { data: course };
  }

  @Patch(':id')
  @RequirePermission({ action: 'update', resourceType: 'course', resourceIdParam: 'id' })
  async updateCourse(@Request() req, @Param('id') id: string, @Body() body) {
    const course = await this.coursesService.updateCourse(req.tenantId, id, body);
    return { data: course };
  }

  @Delete(':id')
  @RequirePermission({ action: 'delete', resourceType: 'course', resourceIdParam: 'id' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteCourse(@Request() req, @Param('id') id: string) {
    await this.coursesService.deleteCourse(req.tenantId, id);
  }

  @Post(':id/publish')
  @RequirePermission({ action: 'publish', resourceType: 'course', resourceIdParam: 'id' })
  async publishCourse(@Request() req, @Param('id') id: string) {
    const course = await this.coursesService.publishCourse(req.tenantId, id, req.user.sub);
    return { data: course };
  }

  @Post(':id/unpublish')
  @RequirePermission({ action: 'publish', resourceType: 'course', resourceIdParam: 'id' })
  async unpublishCourse(@Request() req, @Param('id') id: string) {
    const course = await this.coursesService.unpublishCourse(req.tenantId, id);
    return { data: course };
  }

  @Post(':id/archive')
  @RequirePermission({ action: 'archive', resourceType: 'course', resourceIdParam: 'id' })
  async archiveCourse(@Request() req, @Param('id') id: string) {
    const course = await this.coursesService.archiveCourse(req.tenantId, id);
    return { data: course };
  }
}

@Controller('api/v1/public/courses')
export class PublicCoursesController {
  constructor(private coursesService: CoursesService) {}

  @Get()
  async listPublicCourses(
    @Request() req,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
  ) {
    const result = await this.coursesService.getPublicCourses(req.tenantId, cursor, limit, req.query.search);
    return {
      data: result.courses,
      pagination: { hasNextPage: !!result.nextCursor, nextCursor: result.nextCursor },
    };
  }

  @Get(':slug')
  async getPublicCourse(@Request() req, @Param('slug') slug: string) {
    const course = await this.coursesService.getPublicCourses(req.tenantId, undefined, 1, slug);
    if (!course || course.courses.length === 0) {
      throw new NotFoundException('Course not found');
    }
    return { data: course.courses[0] };
  }

  @Get(':slug/preview')
  async previewCourse(@Request() req, @Param('slug') slug: string) {
    const preview = await this.coursesService.getCoursePreview(req.tenantId, slug);
    return { data: preview };
  }
}

@Controller('api/v1/teacher/sections')
@UseGuards(JwtAuthGuard)
export class SectionsController {
  constructor(private coursesService: CoursesService) {}

  @Post('courses/:courseId/sections')
  @RequirePermission({ action: 'create', resourceType: 'section' })
  @HttpCode(HttpStatus.CREATED)
  async createSection(@Request() req, @Param('courseId') courseId: string, @Body() body: any) {
    // Implementation will be in sections service
    return { message: 'Section creation - to be implemented' };
  }

  @Get('courses/:courseId/sections')
  @RequirePermission({ action: 'read', resourceType: 'section' })
  async listSections(@Request() req, @Param('courseId') courseId: string, @Query() query: any) {
    return { message: 'List sections - to be implemented' };
  }

  @Patch(':id')
  @RequirePermission({ action: 'update', resourceType: 'section', resourceIdParam: 'id' })
  async updateSection(@Request() req, @Param('id') id: string, @Body() body: any) {
    return { message: 'Update section - to be implemented' };
  }

  @Delete(':id')
  @RequirePermission({ action: 'delete', resourceType: 'section', resourceIdParam: 'id' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteSection(@Request() req, @Param('id') id: string) {
    return { message: 'Delete section - to be implemented' };
  }

  @Patch('courses/:courseId/sections/reorder')
  @RequirePermission({ action: 'reorder', resourceType: 'section' })
  async reorderSections(@Request() req, @Param('courseId') courseId: string, @Body() body: { items: { id: string; position: number }[] }) {
    return { message: 'Reorder sections - to be implemented' };
  }
}

@Controller('api/v1/teacher/lessons')
@UseGuards(JwtAuthGuard)
export class TeacherLessonsController {
  constructor(private coursesService: CoursesService) {}

  @Post('sections/:sectionId/lessons')
  @RequirePermission({ action: 'create', resourceType: 'lesson' })
  @HttpCode(HttpStatus.CREATED)
  async createLesson(@Request() req, @Param('sectionId') sectionId: string, @Body() body: any) {
    return { message: 'Lesson creation - to be implemented' };
  }

  @Get('sections/:sectionId/lessons')
  @RequirePermission({ action: 'read', resourceType: 'lesson' })
  async listLessons(@Request() req, @Param('sectionId') sectionId: string, @Query() query: any) {
    return { message: 'List lessons - to be implemented' };
  }

  @Get(':id')
  @RequirePermission({ action: 'read', resourceType: 'lesson', resourceIdParam: 'id' })
  async getLesson(@Request() req, @Param('id') id: string) {
    return { message: 'Get lesson - to be implemented' };
  }

  @Patch(':id')
  @RequirePermission({ action: 'update', resourceType: 'lesson', resourceIdParam: 'id' })
  async updateLesson(@Request() req, @Param('id') id: string, @Body() body: any) {
    return { message: 'Update lesson - to be implemented' };
  }

  @Delete(':id')
  @RequirePermission({ action: 'delete', resourceType: 'lesson', resourceIdParam: 'id' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteLesson(@Request() req, @Param('id') id: string) {
    return { message: 'Delete lesson - to be implemented' };
  }

  @Post(':id/publish')
  @RequirePermission({ action: 'publish', resourceType: 'lesson', resourceIdParam: 'id' })
  async publishLesson(@Request() req, @Param('id') id: string) {
    return { message: 'Publish lesson - to be implemented' };
  }

  @Post(':id/unpublish')
  @RequirePermission({ action: 'publish', resourceType: 'lesson', resourceIdParam: 'id' })
  async unpublishLesson(@Request() req, @Param('id') id: string) {
    return { message: 'Unpublish lesson - to be implemented' };
  }
}

@Controller('api/v1/student/lessons')
@UseGuards(JwtAuthGuard)
export class StudentLessonsController {
  constructor(private coursesService: CoursesService) {}

  @Get(':lessonId')
  @RequirePermission({ action: 'read', resourceType: 'lesson', resourceIdParam: 'lessonId' })
  async getLesson(@Request() req, @Param('lessonId') lessonId: string) {
    return { message: 'Student lesson access - to be implemented' };
  }
}