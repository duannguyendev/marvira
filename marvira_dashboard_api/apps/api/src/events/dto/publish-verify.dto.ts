import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class SubmitPublishVerifyDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  questionId!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  answer!: string;
}
