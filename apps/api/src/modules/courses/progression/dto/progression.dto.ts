import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ContentUnlockType, ContentLockStatus } from '@prisma/client';

export class UnlockContentDto {
  @ApiProperty({ 
    example: 'lesson-123', 
    description: 'ID of the content to unlock (lesson/exam/assignment)' 
  })
  @IsString()
  targetId: string;

  @ApiProperty({ 
    enum: ContentUnlockType, 
    example: 'ENTER_ASSIGNMENT',
    description: 'Type of unlock trigger' 
  })
  @IsEnum(ContentUnlockType)
  unlockType: ContentUnlockType;

  @ApiPropertyOptional({ 
    example: 'assignment-456', 
    description: 'ID of the assignment/exam that triggered the unlock' 
  })
  @IsOptional()
  @IsString()
  sourceId?: string;

  @ApiProperty({ example: 'idem-key-abc', description: 'Idempotency key for safe retries' })
  @IsString()
  idempotencyKey: string;
}

export class ContentLockStatusResponseDto {
  @ApiProperty({ example: 'lesson-123' })
  contentId: string;

  @ApiProperty({ enum: ContentLockStatus, example: 'LOCKED' })
  lockStatus: ContentLockStatus;

  @ApiProperty({ enum: ContentUnlockType, example: 'ENTER_ASSIGNMENT' })
  unlockType: ContentUnlockType;

  @ApiPropertyOptional({ example: 'assignment-456' })
  unlockTargetId?: string;

  @ApiPropertyOptional({ example: 'assignment-456' })
  assignmentId?: string;

  @ApiPropertyOptional({ example: 'exam-789' })
  examId?: string;

  @ApiPropertyOptional()
  isUnlocked: boolean;

  @ApiPropertyOptional()
  unlockedAt?: Date;

  @ApiPropertyOptional()
  reason?: string;
}

export class ContentProgressionResponseDto {
  @ApiProperty()
  lessonId: string;

  @ApiProperty()
  lessonTitle: string;

  @ApiProperty({ enum: ContentLockStatus })
  lockStatus: ContentLockStatus;

  @ApiProperty({ enum: ContentUnlockType })
  unlockType: ContentUnlockType;

  @ApiPropertyOptional()
  unlockTargetId?: string;

  @ApiPropertyOptional()
  assignmentId?: string;

  @ApiPropertyOptional()
  examId?: string;

  @ApiProperty()
  isUnlocked: boolean;

  @ApiPropertyOptional()
  unlockedAt?: Date;

  // Assignment/Exam specific info if this lesson has them
  @ApiPropertyOptional()
  assignment?: {
    id: string;
    title: string;
    timerMinutes: number;
    status: string;
    studentAttemptCount: number;
    maxAttempts: number;
    canAttempt: boolean;
  };

  @ApiPropertyOptional()
  exam?: {
    id: string;
    title: string;
    timerMinutes: number;
    passingScore: number;
    status: string;
    attemptCount: number;
    maxAttempts: number;
    canAttempt: boolean;
  };

  // Next unlocked content
  @ApiPropertyOptional()
  nextUnlockedContent?: {
    id: string;
    title: string;
    type: string;
  };
}

export class StudentCourseProgressDto {
  @ApiProperty()
  courseId: string;

  @ApiProperty()
  courseTitle: string;

  @ApiProperty()
  sections: StudentSectionProgressDto[];

  @ApiProperty()
  overallProgressPercent: number;

  @ApiProperty()
  completedLessons: number;

  @ApiProperty()
  totalLessons: number;
}

export class StudentSectionProgressDto {
  @ApiProperty()
  sectionId: string;

  @ApiProperty()
  sectionTitle: string;

  @ApiProperty()
  orderIndex: number;

  @ApiProperty({ type: [ContentProgressionResponseDto] })
  lessons: ContentProgressionResponseDto[];
}

export class BulkUnlockCheckDto {
  @ApiProperty({ type: [String], example: ['lesson-1', 'lesson-2', 'lesson-3'] })
  @IsArray()
  @IsString({ each: true })
  contentIds: string[];

  @ApiProperty({ example: 'idem-key-bulk', description: 'Idempotency key for safe retries' })
  @IsString()
  idempotencyKey: string;
}

export class BulkUnlockCheckResponseDto {
  @ApiProperty({ type: [ContentLockStatusResponseDto] })
  results: ContentLockStatusResponseDto[];
}

export class TeacherProgressionOverviewDto {
  @ApiProperty()
  courseId: string;

  @ApiProperty()
  courseTitle: string;

  @ApiProperty()
  sections: TeacherSectionProgressionDto[];

  @ApiProperty()
  stats: {
    totalStudents: number;
    studentsWithProgress: number;
    averageProgressPercent: number;
    completionRate: number;
  };
}

export class TeacherSectionProgressionDto {
  @ApiProperty()
  sectionId: string;

  @ApiProperty()
  sectionTitle: string;

  @ApiProperty()
  orderIndex: number;

  @ApiProperty({ type: () => [TeacherLessonProgressionDto] })
  lessons: TeacherLessonProgressionDto[];
}

export class TeacherLessonProgressionDto {
  @ApiProperty()
  lessonId: string;

  @ApiProperty()
  lessonTitle: string;

  @ApiProperty({ enum: ContentLockStatus })
  lockStatus: ContentLockStatus;

  @ApiProperty({ enum: ContentUnlockType })
  unlockType: ContentUnlockType;

  @ApiProperty()
  isUnlocked: boolean;

  @ApiProperty()
  unlockedStudentCount: number;

  @ApiProperty()
  totalEnrolledStudents: number;

  @ApiPropertyOptional()
  assignment?: {
    id: string;
    title: string;
    submissionsCount: number;
    gradedCount: number;
  };

  @ApiPropertyOptional()
  exam?: {
    id: string;
    title: string;
    attemptsCount: number;
    passedCount: number;
  };
}