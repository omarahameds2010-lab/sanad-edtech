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
import { ExamStatus, ExamQuestionType } from "@prisma/client";

export class CreateExamDto {
  @ApiProperty({ example: "Midterm Exam: Programming Fundamentals" })
  @IsString()
  title: string;

  @ApiPropertyOptional({
    example: "Covers variables, loops, functions, and arrays",
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    example: "Answer all questions. No external resources allowed.",
  })
  @IsOptional()
  @IsString()
  instructions?: string;

  @ApiPropertyOptional({
    example: 70,
    description: "Timer in minutes (default: 70)",
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(480)
  timerMinutes?: number = 70;

  @ApiPropertyOptional({
    example: 60,
    description: "Passing score percentage (0-100, default: 60)",
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  passingScore?: number = 60;

  @ApiPropertyOptional({
    example: 2,
    description: "Maximum attempts allowed (default: 1)",
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  maxAttempts?: number = 1;

  @ApiPropertyOptional({
    example: false,
    description: "Shuffle question order",
  })
  @IsOptional()
  @IsBoolean()
  shuffleQuestions?: boolean = false;

  @ApiPropertyOptional({
    example: false,
    description: "Shuffle option order for MCQ",
  })
  @IsOptional()
  @IsBoolean()
  shuffleOptions?: boolean = false;

  @ApiPropertyOptional({
    example: true,
    description: "Show results after submission",
  })
  @IsOptional()
  @IsBoolean()
  showResults?: boolean = true;

  @ApiPropertyOptional({
    example: false,
    description: "Show correct answers after submission",
  })
  @IsOptional()
  @IsBoolean()
  showCorrectAnswers?: boolean = false;
}

export class UpdateExamDto {
  @ApiPropertyOptional({ example: "Midterm Exam: Programming Fundamentals" })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({
    example: "Covers variables, loops, functions, and arrays",
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    example: "Answer all questions. No external resources allowed.",
  })
  @IsOptional()
  @IsString()
  instructions?: string;

  @ApiPropertyOptional({ example: 70 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(480)
  timerMinutes?: number;

  @ApiPropertyOptional({ example: 60 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  passingScore?: number;

  @ApiPropertyOptional({ example: 2 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  maxAttempts?: number;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  shuffleQuestions?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  shuffleOptions?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  showResults?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  showCorrectAnswers?: boolean;

  @ApiPropertyOptional({ enum: ExamStatus })
  @IsOptional()
  @IsEnum(ExamStatus)
  status?: ExamStatus;
}

export class CreateExamQuestionDto {
  @ApiProperty({ enum: ExamQuestionType, example: "MCQ" })
  @IsEnum(ExamQuestionType)
  type: ExamQuestionType;

  @ApiProperty({ example: 'What is the output of console.log(2 + "2")?' })
  @IsString()
  text: string;

  @ApiPropertyOptional({
    example: 'JavaScript coerces number to string, so result is "22"',
  })
  @IsOptional()
  @IsString()
  explanation?: string;

  @ApiPropertyOptional({
    example: 1,
    description: "Points for this question (default: 1)",
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  points?: number = 1;

  @ApiPropertyOptional({
    example: 0,
    description: "Position/order in exam (default: 0)",
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  position?: number = 0;

  @ApiPropertyOptional({
    example: [
      { id: "a", text: "22" },
      { id: "b", text: "4" },
      { id: "c", text: "NaN" },
      { id: "d", text: "Error" },
    ],
    description: "Options for MCQ and TRUE_FALSE",
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExamQuestionOptionDto)
  options?: ExamQuestionOptionDto[];

  @ApiPropertyOptional({
    example: { correctOptionId: "a" },
    description: "Answer key - format depends on question type",
  })
  @IsOptional()
  correctAnswer?: any;
}

export class ExamQuestionOptionDto {
  @ApiProperty({ example: "a" })
  @IsString()
  id: string;

  @ApiProperty({ example: "22" })
  @IsString()
  text: string;

  @ApiPropertyOptional({
    example: true,
    description: "Whether this is the correct answer",
  })
  @IsOptional()
  @IsBoolean()
  isCorrect?: boolean;
}

export class UpdateExamQuestionDto {
  @ApiPropertyOptional({ enum: ExamQuestionType })
  @IsOptional()
  @IsEnum(ExamQuestionType)
  type?: ExamQuestionType;

  @ApiPropertyOptional({
    example: 'What is the output of console.log(2 + "2")?',
  })
  @IsOptional()
  @IsString()
  text?: string;

  @ApiPropertyOptional({ example: "JavaScript coerces number to string..." })
  @IsOptional()
  @IsString()
  explanation?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  points?: number;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  position?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExamQuestionOptionDto)
  options?: ExamQuestionOptionDto[];

  @ApiPropertyOptional()
  @IsOptional()
  correctAnswer?: any;
}

export class StartExamAttemptDto {
  @ApiProperty({
    example: "idem-key-456",
    description: "Idempotency key for safe retries",
  })
  @IsString()
  idempotencyKey: string;
}

export class SubmitExamAnswerDto {
  @ApiProperty({ example: "q1", description: "Question ID" })
  @IsString()
  questionId: string;

  @ApiProperty({
    example: "a",
    description: "Selected option ID for MCQ, or answer text for other types",
  })
  answer: any;
}

export class SubmitExamAttemptDto {
  @ApiProperty({
    type: [SubmitExamAnswerDto],
    description: "Answers for all questions",
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SubmitExamAnswerDto)
  answers: SubmitExamAnswerDto[];

  @ApiProperty({
    example: "idem-key-789",
    description: "Idempotency key for safe retries",
  })
  @IsString()
  idempotencyKey: string;
}

export class GradeExamAttemptDto {
  @ApiProperty({ example: 85, description: "Score percentage (0-100)" })
  @IsInt()
  @Min(0)
  @Max(100)
  score: number;

  @ApiPropertyOptional({
    example: "Good work! Review loops.",
    description: "Overall feedback",
  })
  @IsOptional()
  @IsString()
  feedback?: string;

  @ApiPropertyOptional({
    type: "object",
    example: {
      q1: { score: 1, feedback: "Correct" },
      q2: { score: 0, feedback: "Incorrect" },
    },
    description: "Per-question grading details",
  })
  @IsOptional()
  gradingData?: Record<string, any>;
}

export class ExamQueryDto {
  @ApiPropertyOptional({ example: "PUBLISHED", enum: ExamStatus })
  @IsOptional()
  @IsEnum(ExamStatus)
  status?: ExamStatus;

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

export class ExamResponseDto {
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

  @ApiProperty()
  passingScore: number;

  @ApiProperty()
  maxAttempts: number;

  @ApiProperty()
  shuffleQuestions: boolean;

  @ApiProperty()
  shuffleOptions: boolean;

  @ApiProperty()
  showResults: boolean;

  @ApiProperty()
  showCorrectAnswers: boolean;

  @ApiProperty({ enum: ExamStatus })
  status: ExamStatus;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  // Computed fields for student view
  @ApiPropertyOptional()
  questionCount?: number;

  @ApiPropertyOptional()
  attemptCount?: number;

  @ApiPropertyOptional()
  canAttempt?: boolean;

  @ApiPropertyOptional()
  timeRemainingSeconds?: number;

  @ApiPropertyOptional()
  isExpired?: boolean;
}

export class ExamQuestionResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  tenantId: string;

  @ApiProperty()
  examId: string;

  @ApiProperty({ enum: ExamQuestionType })
  type: ExamQuestionType;

  @ApiProperty()
  text: string;

  @ApiPropertyOptional()
  explanation?: string;

  @ApiProperty()
  points: number;

  @ApiProperty()
  position: number;

  @ApiPropertyOptional()
  options?: ExamQuestionOptionDto[];

  // NOTE: correctAnswer is NEVER exposed to students
  @ApiPropertyOptional()
  correctAnswer?: any;
}

export class ExamAttemptResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  tenantId: string;

  @ApiProperty()
  examId: string;

  @ApiProperty()
  studentId: string;

  @ApiProperty()
  attemptNumber: number;

  @ApiProperty({
    enum: ["IN_PROGRESS", "SUBMITTED", "GRADED", "TIMED_OUT", "CANCELLED"],
  })
  status: string;

  @ApiProperty()
  startedAt: Date;

  @ApiPropertyOptional()
  submittedAt?: Date;

  @ApiPropertyOptional()
  timeRemainingSeconds?: number;

  @ApiPropertyOptional()
  score?: number;

  @ApiPropertyOptional()
  passed?: boolean;

  @ApiPropertyOptional()
  answers?: Record<string, any>;

  @ApiPropertyOptional()
  gradingData?: Record<string, any>;

  @ApiPropertyOptional()
  gradedAt?: Date;

  @ApiPropertyOptional()
  gradedBy?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiPropertyOptional()
  isExpired?: boolean;
}

export class StartExamAttemptResponseDto {
  @ApiProperty()
  attemptId: string;

  @ApiProperty()
  examId: string;

  @ApiProperty()
  startedAt: Date;

  @ApiProperty()
  expiresAt: Date;

  @ApiProperty()
  timeRemainingSeconds: number;

  @ApiProperty()
  timerMinutes: number;

  @ApiProperty({ type: [ExamQuestionResponseDto] })
  questions: ExamQuestionResponseDto[];
}

export class ExamTimerResponseDto {
  @ApiProperty()
  expiresAt: Date;

  @ApiProperty()
  timeRemainingSeconds: number;

  @ApiProperty()
  isExpired: boolean;

  @ApiProperty()
  status: string;
}

export class SubmitExamResponseDto {
  @ApiProperty()
  attemptId: string;

  @ApiProperty()
  status: string;

  @ApiProperty()
  submittedAt: Date;

  @ApiPropertyOptional()
  score?: number;

  @ApiPropertyOptional()
  passed?: boolean;

  @ApiPropertyOptional()
  message?: string;
}
