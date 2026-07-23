import {
  IsEmail,
  IsOptional,
  IsString,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'admin@marvira.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'admin123' })
  @IsString()
  @MinLength(6)
  password!: string;
}

export class RegisterDto {
  @ApiProperty({ example: 'player@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'Jane Doe' })
  @IsString()
  @MinLength(2)
  name!: string;

  @ApiProperty({ example: 'SecurePass123' })
  @IsString()
  @MinLength(6)
  password!: string;
}

export class ForgotPasswordDto {
  @ApiProperty({ example: 'player@example.com' })
  @IsEmail()
  email!: string;
}

export class ResetPasswordDto {
  @ApiProperty()
  @IsString()
  token!: string;

  @ApiProperty({ example: 'NewSecurePass123' })
  @IsString()
  @MinLength(6)
  password!: string;
}

export class RefreshTokenDto {
  @ApiProperty()
  @IsString()
  refreshToken!: string;
}

export class GoogleAuthDto {
  @ApiPropertyOptional({ description: 'Google ID token from mobile SDK' })
  @ValidateIf((dto: GoogleAuthDto) => !dto.email)
  @IsString()
  idToken?: string;

  @ApiPropertyOptional({ description: 'Dev fallback when idToken is not used' })
  @ValidateIf((dto: GoogleAuthDto) => !dto.idToken)
  @IsEmail()
  email?: string;

  @ApiPropertyOptional()
  @ValidateIf((dto: GoogleAuthDto) => !dto.idToken)
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  avatar?: string;
}

export class FacebookAuthDto {
  @ApiPropertyOptional({ description: 'Facebook access token from mobile SDK' })
  @ValidateIf((dto: FacebookAuthDto) => !dto.email)
  @IsString()
  accessToken?: string;

  @ApiPropertyOptional({
    description: 'Dev fallback when accessToken is not used',
  })
  @ValidateIf((dto: FacebookAuthDto) => !dto.accessToken)
  @IsEmail()
  email?: string;

  @ApiPropertyOptional()
  @ValidateIf((dto: FacebookAuthDto) => !dto.accessToken)
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  avatar?: string;
}

export class AppleAuthDto {
  @ApiPropertyOptional({ description: 'Apple identity token from mobile SDK' })
  @ValidateIf((dto: AppleAuthDto) => !dto.email)
  @IsString()
  identityToken?: string;

  @ApiPropertyOptional({
    description: 'Name from Apple (only sent on first sign-in)',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: 'Dev fallback when identityToken is not used',
  })
  @ValidateIf((dto: AppleAuthDto) => !dto.identityToken)
  @IsEmail()
  email?: string;
}
