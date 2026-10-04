import { IsString, IsOptional } from 'class-validator';

export class LoginDto {
  @IsString()
  phone: string;

  @IsString()
  password: string;

  @IsOptional()
  @IsString()
  deviceFingerprint?: string;
}
