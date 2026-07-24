import {
  IsString,
  IsEnum,
  IsOptional,
  IsBoolean,
  Min,
  Max,
  MinLength,
  MaxLength,
  IsNotEmpty,
  IsNumber,
  IsInt,
  IsArray,
  ArrayMaxSize,
  IsIn,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EventDifficulty } from '@prisma/client';
import { Type } from 'class-transformer';
import { CONTENT_LANGUAGES } from '../../common/content-language';

export class CreateEventDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(200)
  title!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  @MaxLength(5000)
  description!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  city!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  coverImage?: string;

  @ApiProperty({ enum: EventDifficulty })
  @IsEnum(EventDifficulty)
  difficulty!: EventDifficulty;

  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100000)
  rewardPoints!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Content language (vi | en | zh | ja)',
    enum: CONTENT_LANGUAGES,
  })
  @IsOptional()
  @IsIn([...CONTENT_LANGUAGES])
  language?: string;

  @ApiPropertyOptional({ description: 'Set event join password (min 4 chars)' })
  @IsOptional()
  @IsString()
  @MinLength(4)
  @MaxLength(64)
  joinPassword?: string;

  @ApiPropertyOptional({ description: 'Clear password protection when true' })
  @IsOptional()
  @IsBoolean()
  clearJoinPassword?: boolean;

  @ApiPropertyOptional({
    description: 'Message shown on completion (thanks + redeem how-to)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  completionMessage?: string | null;

  @ApiPropertyOptional({
    description:
      'Short public gift teaser; required when giftCodes is non-empty',
  })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  giftTeaser?: string | null;

  @ApiPropertyOptional({
    description: 'Ordered gift codes for soonest finishers (max 10)',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @IsString({ each: true })
  @MaxLength(64, { each: true })
  giftCodes?: string[];
}

export class UpdateEventDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  @MaxLength(5000)
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  city?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  coverImage?: string;

  @ApiPropertyOptional({ enum: EventDifficulty })
  @IsOptional()
  @IsEnum(EventDifficulty)
  difficulty?: EventDifficulty;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100000)
  rewardPoints?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Content language (vi | en | zh | ja)',
    enum: CONTENT_LANGUAGES,
  })
  @IsOptional()
  @IsIn([...CONTENT_LANGUAGES])
  language?: string;

  @ApiPropertyOptional({ description: 'Set event join password (min 4 chars)' })
  @IsOptional()
  @IsString()
  @MinLength(4)
  @MaxLength(64)
  joinPassword?: string;

  @ApiPropertyOptional({ description: 'Clear password protection when true' })
  @IsOptional()
  @IsBoolean()
  clearJoinPassword?: boolean;

  @ApiPropertyOptional({
    description: 'Message shown on completion (thanks + redeem how-to)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  completionMessage?: string | null;

  @ApiPropertyOptional({
    description:
      'Short public gift teaser; required when giftCodes is non-empty',
  })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  giftTeaser?: string | null;

  @ApiPropertyOptional({
    description: 'Ordered gift codes for soonest finishers (max 10)',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @IsString({ each: true })
  @MaxLength(64, { each: true })
  giftCodes?: string[];
}

export class JoinEventDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MinLength(4)
  @MaxLength(64)
  password!: string;
}

export class NearbyQueryDto {
  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude!: number;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude!: number;

  @ApiPropertyOptional({ default: 50 })
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  @Max(500)
  radiusKm?: number;

  @ApiPropertyOptional({
    description: 'Content language filter, or "all"',
  })
  @IsOptional()
  @IsString()
  language?: string;
}
