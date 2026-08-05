import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DevicePlatform } from '@prisma/client';

export class RegisterDeviceDto {
  @ApiProperty()
  @IsString()
  @MaxLength(4096)
  fcmToken!: string;

  @ApiProperty({ enum: DevicePlatform })
  @IsEnum(DevicePlatform)
  platform!: DevicePlatform;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(64)
  appVersion?: string;

  @ApiPropertyOptional({ enum: ['vi', 'en', 'zh', 'ja'] })
  @IsOptional()
  @IsString()
  @MaxLength(8)
  locale?: string;
}

export class UnregisterDeviceDto {
  @ApiProperty()
  @IsString()
  @MaxLength(4096)
  fcmToken!: string;
}
