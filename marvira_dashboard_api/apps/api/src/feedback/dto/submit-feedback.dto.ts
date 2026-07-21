import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEmail,
  IsEnum,
  MinLength,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FeedbackCategory, FeedbackSource } from '@prisma/client';

export class SubmitFeedbackDto {
  @ApiPropertyOptional({ example: 'Jane Doe' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({ example: 'jane@example.com' })
  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string;

  @ApiProperty({ enum: FeedbackCategory })
  @IsEnum(FeedbackCategory)
  category!: FeedbackCategory;

  @ApiPropertyOptional({ example: 'App crashes on startup' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  subject?: string;

  @ApiProperty({ example: 'Describe your feedback in detail...' })
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  @MaxLength(5000)
  message!: string;

  @ApiProperty({ enum: FeedbackSource })
  @IsEnum(FeedbackSource)
  source!: FeedbackSource;
}
