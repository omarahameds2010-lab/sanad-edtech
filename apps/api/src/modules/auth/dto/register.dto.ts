import {
  IsString,
  IsOptional,
  IsIn,
  MinLength,
  MaxLength,
  Matches,
} from "class-validator";

export class RegisterDto {
  @IsString()
  @MaxLength(100)
  name: string;

  @IsString()
  @Matches(/^01[0125][0-9]{8}$/, {
    message: "phone must be a valid Egyptian mobile number (e.g. 01012345678)",
  })
  phone: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password: string;

  @IsOptional()
  @IsIn(["STUDENT", "TEACHER"])
  role?: "STUDENT" | "TEACHER";

  @IsOptional()
  @IsString()
  @MaxLength(50)
  grade?: string;

  @IsOptional()
  @IsString()
  deviceFingerprint?: string;
}
