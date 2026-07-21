import { IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class PublishPracticeQuestionDto {
  @ApiProperty()
  @IsBoolean()
  isPublished!: boolean;
}
