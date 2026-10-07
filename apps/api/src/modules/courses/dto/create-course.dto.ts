import {
  IsString,
  IsOptional,
  IsNumber,
  IsEnum,
  Min,
  MaxLength,
  IsUrl,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { CourseStatus } from "@prisma/client";

export class CreateCourseRequest {
  @ApiProperty({ example: "Mathematics for Beginners" })
  @IsString()
  @MaxLength(255)
  title: string;

  @ApiProperty({ example: "mathematics-beginners" })
  @IsString()
  @MaxLength(100)
  slug: string;

  @ApiPropertyOptional({ example: "Learn mathematics from scratch" })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  shortDescription?: string | null;

  @ApiPropertyOptional({
    example: "Complete mathematics course for beginners...",
  })
  @IsOptional()
  @IsString()
  description?: string | null;

  @ApiPropertyOptional({ example: "https://cdn.example.com/thumbnail.jpg" })
  @IsOptional()
  @IsUrl()
  @MaxLength(500)
  thumbnailUrl?: string | null;

  @ApiProperty({ enum: ["PUBLIC", "PRIVATE", "UNLISTED"], example: "PUBLIC" })
  @IsEnum(["PUBLIC", "PRIVATE", "UNLISTED"])
  visibility: string;

  @ApiPropertyOptional({
    enum: ["BEGINNER", "INTERMEDIATE", "ADVANCED"],
    example: "BEGINNER",
  })
  @IsOptional()
  @IsEnum(["BEGINNER", "INTERMEDIATE", "ADVANCED"])
  level?: string | null;

  @ApiProperty({ example: "ar" })
  @IsString()
  @MaxLength(10)
  language: string;

  @ApiPropertyOptional({ example: 500 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number | null;

  @ApiPropertyOptional({ example: "EGP" })
  @IsOptional()
  @IsString()
  @MaxLength(3)
  currency?: string | null;
}

export class UpdateCourseRequest {
  @ApiPropertyOptional({ example: "Advanced Mathematics" })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @ApiPropertyOptional({ example: "advanced-mathematics" })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  slug?: string;

  @ApiPropertyOptional({ example: "Advanced mathematics course" })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  shortDescription?: string | null;

  @ApiPropertyOptional({ example: "Complete advanced mathematics course..." })
  @IsOptional()
  @IsString()
  description?: string | null;

  @ApiPropertyOptional({ example: "https://cdn.example.com/thumbnail.jpg" })
  @IsOptional()
  @IsUrl()
  @MaxLength(500)
  thumbnailUrl?: string | null;

  @ApiPropertyOptional({
    enum: ["PUBLIC", "PRIVATE", "UNLISTED"],
    example: "PUBLIC",
  })
  @IsOptional()
  @IsEnum(["PUBLIC", "PRIVATE", "UNLISTED"])
  visibility?: string;

  @ApiPropertyOptional({
    enum: ["BEGINNER", "INTERMEDIATE", "ADVANCED"],
    example: "INTERMEDIATE",
  })
  @IsOptional()
  @IsEnum(["BEGINNER", "INTERMEDIATE", "ADVANCED"])
  level?: string | null;

  @ApiPropertyOptional({ example: "ar" })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  language?: string;

  @ApiPropertyOptional({ example: 1000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number | null;

  @ApiPropertyOptional({ example: "EGP" })
  @IsOptional()
  @IsString()
  @MaxLength(3)
  currency?: string | null;
}
