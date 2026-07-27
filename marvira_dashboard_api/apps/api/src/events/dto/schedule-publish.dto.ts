import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsISO8601, IsOptional } from 'class-validator';

export class SchedulePublishDto {
  @ApiProperty({
    description: 'Future go-live instant in UTC (ISO-8601)',
    example: '2026-08-01T12:00:00.000Z',
  })
  @IsISO8601()
  scheduledPublishAt!: string;

  @ApiPropertyOptional({
    description: 'Admin/staff dashboard checklist confirmed',
  })
  @IsOptional()
  @IsBoolean()
  publishReviewConfirmed?: boolean;
}
