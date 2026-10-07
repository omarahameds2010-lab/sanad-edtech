import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { CourseStatus } from "@prisma/client";

export class CourseResponse {
  @ApiProperty({ example: "cm7abc123" })
  id: string;

  @ApiProperty({ example: "Mathematics for Beginners" })
  title: string;

  @ApiProperty({ example: "mathematics-beginners" })
  slug: string;

  @ApiPropertyOptional({ example: "Learn mathematics from scratch" })
  shortDescription: string | null;

  @ApiPropertyOptional({
    example: "Complete mathematics course for beginners...",
  })
  description: string | null;

  @ApiPropertyOptional({ example: "https://cdn.example.com/thumbnail.jpg" })
  thumbnailUrl: string | null;

  @ApiProperty({ enum: CourseStatus, example: "PUBLISHED" })
  status: string;

  @ApiProperty({ enum: ["PUBLIC", "PRIVATE", "UNLISTED"], example: "PUBLIC" })
  visibility: string;

  @ApiPropertyOptional({ example: "BEGINNER" })
  level: string | null;

  @ApiProperty({ example: "ar" })
  language: string;

  @ApiPropertyOptional({ example: 500 })
  price: number | null;

  @ApiPropertyOptional({ example: "EGP" })
  currency: string | null;

  @ApiPropertyOptional({ example: "2026-10-05T08:00:00.000Z" })
  publishedAt: string | null;

  @ApiProperty({ example: "2026-10-01T10:00:00.000Z" })
  createdAt: string;

  @ApiProperty({ example: "2026-10-05T08:00:00.000Z" })
  updatedAt: string;
}

export class CourseListResponse {
  data: CourseResponse[];
  pagination: {
    hasNextPage: boolean;
    nextCursor: string | null;
  };
}

export class PublicCourseResponse {
  @ApiProperty({ example: "cm7abc123" })
  id: string;

  @ApiProperty({ example: "Mathematics for Beginners" })
  title: string;

  @ApiProperty({ example: "mathematics-beginners" })
  slug: string;

  @ApiPropertyOptional({ example: "Learn mathematics from scratch" })
  shortDescription: string | null;

  @ApiPropertyOptional({
    example: "Complete mathematics course for beginners...",
  })
  description: string | null;

  @ApiPropertyOptional({ example: "https://cdn.example.com/thumbnail.jpg" })
  thumbnailUrl: string | null;

  @ApiProperty({ example: "PUBLIC" })
  visibility: string;

  @ApiPropertyOptional({ example: "BEGINNER" })
  level: string | null;

  @ApiProperty({ example: "ar" })
  language: string;

  @ApiPropertyOptional({ example: 500 })
  price: number | null;

  @ApiPropertyOptional({ example: "EGP" })
  currency: string | null;

  @ApiPropertyOptional({ example: "Mr. Ahmed" })
  teacherName: string | null;
}

export class PublicCourseListResponse {
  data: PublicCourseResponse[];
  pagination: {
    hasNextPage: boolean;
    nextCursor: string | null;
  };
}

export class CoursePreviewResponse {
  @ApiProperty()
  course: PublicCourseResponse;

  @ApiProperty({ type: () => [PublicLessonPreview] })
  previewLessons: PublicLessonPreview[];
}

export class PublicLessonPreview {
  @ApiProperty({ example: "cm7lesson123" })
  id: string;

  @ApiProperty({ example: "Introduction to Algebra" })
  title: string;

  @ApiProperty({
    enum: ["VIDEO", "TEXT", "RESOURCE", "ASSIGNMENT", "EXAM"],
    example: "VIDEO",
  })
  type: string;

  @ApiProperty({ example: 1 })
  position: number;

  @ApiPropertyOptional({ example: 900 })
  durationSeconds: number | null;
}
