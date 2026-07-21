import { IsString, IsNotEmpty, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SubmitTrainingAnswerDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(500)
  answer!: string;
}

export class PracticeStatusQueryDto {
  status?: 'unfinished' | 'completed';
}
