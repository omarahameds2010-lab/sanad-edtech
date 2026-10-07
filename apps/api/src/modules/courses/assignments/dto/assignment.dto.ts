import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsInt,
  Min,
  Max,
  IsEnum,
  IsArray,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";
import { AssignmentStatus } from "@prisma/client";

export class CreateAssignmentDto {
  @ApiProperty({ example: "Week 1 Assignment: Variables and Data Types" })
  @IsString()
  title: string;

  @ApiPropertyOptional({
    example: "Complete the exercises on variables and data types",
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: "Submit your code files as a zip archive" })
  @IsOptional()
  @IsString()
  instructions?: string;

  @ApiPropertyOptional({
    example: 300,
    description: "Timer in minutes (default: 300 = 5 hours)",
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10080) // Max 1 week
  timerMinutes?: number = 300;

  @ApiPropertyOptional({
    example: 60,
    description: "Passing score percentage (0-100)",
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  passingScore?: number;

  @ApiPropertyOptional({
    example: 3,
    description: "Maximum attempts allowed (default: 1)",
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  maxAttempts?: number = 1;

  @ApiPropertyOptional({
    example: true,
    description: "Allow late submissions after timer expires",
  })
  @IsOptional()
  @IsBoolean()
  allowLateSubmission?: boolean = true;

  @ApiPropertyOptional({
    example: 10,
    description: "Late penalty percentage (0-100)",
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  latePenaltyPercent?: number = 0;
}

export class UpdateAssignmentDto {
  @ApiPropertyOptional({
    example: "Week 1 Assignment: Variables and Data Types",
  })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({
    example: "Complete the exercises on variables and data types",
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: "Submit your code files as a zip archive" })
  @IsOptional()
  @IsString()
  instructions?: string;

  @ApiPropertyOptional({ example: 300 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10080)
  timerMinutes?: number;

  @ApiPropertyOptional({ example: 60 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  passingScore?: number;

  @ApiPropertyOptional({ example: 3 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  maxAttempts?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  allowLateSubmission?: boolean;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  latePenaltyPercent?: number;

  @ApiPropertyOptional({ enum: AssignmentStatus })
  @IsOptional()
  @IsEnum(AssignmentStatus)
  status?: AssignmentStatus;
}

export class SubmitAssignmentDto {
  @ApiPropertyOptional({ example: "My solution code here..." })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiPropertyOptional({
    example: [
      {
        url: "https://storage.example.com/file1.zip",
        name: "solution.zip",
        size: 1024,
      },
    ],
    description: "Array of file attachments with url, name, size",
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AttachmentDto)
  attachments?: AttachmentDto[];

  @ApiProperty({
    example: "idem-key-123",
    description: "Idempotency key for safe retries",
  })
  @IsString()
  idempotencyKey: string;
}

export class AttachmentDto {
  @ApiProperty({ example: "https://storage.example.com/file1.zip" })
  @IsString()
  url: string;

  @ApiProperty({ example: "solution.zip" })
  @IsString()
  name: string;

  @ApiProperty({ example: 1024 })
  @IsNumber()
  size: number;

  @ApiPropertyOptional({ example: "application/zip" })
  @IsOptional()
  @IsString()
  mimeType?: string;
}

export class GradeAssignmentDto {
  @ApiProperty({ example: 85, description: "Score percentage (0-100)" })
  @IsInt()
  @Min(0)
  @Max(100)
  score: number;

  @ApiPropertyOptional({
    example: "Good work! Consider adding error handling.",
  })
  @IsOptional()
  @IsString()
  feedback?: string;
}

export class AssignmentQueryDto {
  @ApiPropertyOptional({ example: "PUBLISHED", enum: AssignmentStatus })
  @IsOptional()
  @IsEnum(AssignmentStatus)
  status?: AssignmentStatus;

  @ApiPropertyOptional({ example: 20 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  cursor?: string;
}

export class AssignmentResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  tenantId: string;

  @ApiProperty()
  lessonId: string;

  @ApiProperty()
  title: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiPropertyOptional()
  instructions?: string;

  @ApiProperty()
  timerMinutes: number;

  @ApiPropertyOptional()
  passingScore?: number;

  @ApiProperty()
  maxAttempts: number;

  @ApiProperty()
  allowLateSubmission: boolean;

  @ApiProperty()
  latePenaltyPercent: number;

  @ApiProperty({ enum: AssignmentStatus })
  status: AssignmentStatus;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  // Computed fields for student view
  @ApiPropertyOptional()
  studentAttemptCount?: number;

  @ApiPropertyOptional()
  canAttempt?: boolean;

  @ApiPropertyOptional()
  timeRemainingSeconds?: number;

  @ApiPropertyOptional()
  isExpired?: boolean;
}

export class AssignmentSubmissionResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  tenantId: string;

  @ApiProperty()
  assignmentId: string;

  @ApiProperty()
  studentId: string;

  @ApiPropertyOptional()
  content?: string;

  @ApiPropertyOptional()
  attachments?: AttachmentDto[];

  @ApiProperty({
    enum: ["SUBMITTED", "GRADED", "LATE", "REJECTED", "RETURNED"],
  })
  status: string;

  @ApiPropertyOptional()
  score?: number;

  @ApiPropertyOptional()
  gradedBy?: string;

  @ApiPropertyOptional()
  gradedAt?: Date;

  @ApiPropertyOptional()
  feedback?: string;

  @ApiProperty()
  submittedAt: Date;

  @ApiPropertyOptional()
  isLate?: boolean;

  @ApiPropertyOptional()
  timeRemainingSeconds?: number;
}

export class StartAssignmentResponseDto {
  @ApiProperty()
  attemptId: string;

  @ApiProperty()
  assignmentId: string;

  @ApiProperty()
  startedAt: Date;

  @ApiProperty()
  expiresAt: Date;

  @ApiProperty()
  timeRemainingSeconds: number;

  @ApiProperty()
  timerMinutes: number;
}

export class AssignmentTimerResponseDto {
  @ApiProperty()
  expiresAt: Date;

  @ApiProperty()
  timeRemainingSeconds: number;

  @ApiProperty()
  isExpired: boolean;

  @ApiProperty()
  status: string;
}
