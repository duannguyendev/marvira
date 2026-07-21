import { IsIn, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SuspendDuration } from '../anticheat.types';

export class SuspendPlayDto {
  @ApiProperty({ enum: ['1d', '2d', '1w', '1m'] })
  @IsIn(['1d', '2d', '1w', '1m'])
  duration!: SuspendDuration;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reason?: string;
}

export class ModerationReasonDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reason?: string;
}
