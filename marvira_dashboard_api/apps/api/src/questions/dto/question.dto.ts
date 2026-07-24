import {
  IsString,
  IsEnum,
  IsOptional,
  IsArray,
  IsInt,
  Min,
  Max,
  MinLength,
  MaxLength,
  ValidateIf,
  IsNotEmpty,
  IsIn,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { QuestionType } from '@prisma/client';
import { CONTENT_LANGUAGES } from '../../common/content-language';

export class CreateQuestionDto {
  @ApiProperty({
    description:
      'Question text or caption (shown with the image for IMAGE type)',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(2000)
  question!: string;

  @ApiProperty({ enum: QuestionType })
  @IsEnum(QuestionType)
  type!: QuestionType;

  @ApiPropertyOptional({
    description:
      'Image URL for IMAGE type questions (upload via POST /uploads)',
  })
  @ValidateIf(o => o.type === QuestionType.IMAGE)
  @IsString()
  @IsNotEmpty()
  imageUrl?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  options?: string[];

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(500)
  answer!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  explanation?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(1000)
  points?: number;

  @ApiPropertyOptional({
    description: 'Content language (vi | en | zh | ja)',
    enum: CONTENT_LANGUAGES,
  })
  @IsOptional()
  @IsIn([...CONTENT_LANGUAGES])
  language?: string;
}

export class UpdateQuestionDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(2000)
  question?: string;

  @ApiPropertyOptional({ enum: QuestionType })
  @IsOptional()
  @IsEnum(QuestionType)
  type?: QuestionType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  options?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(500)
  answer?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  explanation?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(1000)
  points?: number;

  @ApiPropertyOptional({
    description: 'Content language (vi | en | zh | ja)',
    enum: CONTENT_LANGUAGES,
  })
  @IsOptional()
  @IsIn([...CONTENT_LANGUAGES])
  language?: string;
}

export class LinkQuestionToEventDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  questionId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  orderIndex?: number;
}
