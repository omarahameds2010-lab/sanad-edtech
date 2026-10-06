import { Module } from '@nestjs/common';
import { CoursesService } from './courses.service';
import { TeacherCoursesController } from './courses.controller';
import { PublicCoursesController } from './courses.controller';
import { SectionsController } from './courses.controller';
import { TeacherLessonsController } from './courses.controller';
import { StudentLessonsController } from './courses.controller';
import { StudentEnrollmentsController } from './courses.controller';
import { PrismaService } from '../tenants/prisma.service';
import { AuthorizationModule } from '../authorization/authorization.module';
import { FeatureFlagsModule } from '../feature-flags/feature-flags.module';
import { EntitlementsModule } from '../entitlements/entitlements.module';
import { AuthModule } from '../auth/auth.module';
import { ProgressionModule } from './progression/progression.module';
import { AssignmentsModule } from './assignments/assignments.module';
import { ExamsModule } from './exams/exams.module';
import { SectionsModule } from './sections/sections.module';
import { LessonsModule } from './lessons/lessons.module';
import { EnrollmentsModule } from './enrollments/enrollments.module';
import { ProgressModule } from './progress/progress.module';
import { ProgressController } from './progress/progress.controller';

@Module({
  imports: [
    AuthorizationModule,
    FeatureFlagsModule,
    EntitlementsModule,
    AuthModule,
    ProgressionModule,
    AssignmentsModule,
    ExamsModule,
    SectionsModule,
    LessonsModule,
    EnrollmentsModule,
    ProgressModule,
  ],
  controllers: [
    TeacherCoursesController,
    PublicCoursesController,
    SectionsController,
    TeacherLessonsController,
    StudentLessonsController,
    StudentEnrollmentsController,
    ProgressController,
  ],
  providers: [CoursesService, PrismaService],
  exports: [CoursesService],
})
export class CoursesModule {}