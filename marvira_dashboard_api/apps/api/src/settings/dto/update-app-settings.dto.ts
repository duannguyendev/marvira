import { IsInt, IsOptional, Max, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class UpdateAppSettingsDto {
  @ApiPropertyOptional({
    description:
      'Days a live event stays in public search before auto-ending (1–3650)',
    minimum: 1,
    maximum: 3650,
    example: 2,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(3650)
  eventLiveDurationDays?: number;
}
