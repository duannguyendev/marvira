import { Controller, Post, Patch, Delete, Body, Param } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { QuestionsService } from './questions.service';
import { CreateQuestionDto, UpdateQuestionDto } from './dto/question.dto';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('questions')
@Controller('questions')
@ApiBearerAuth()
export class QuestionsController {
  constructor(private readonly questionsService: QuestionsService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.STAFF, UserRole.USER)
  @ApiOperation({ summary: 'Create question' })
  async create(@Body() dto: CreateQuestionDto) {
    const data = await this.questionsService.create(dto);
    return { success: true, data };
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Update question (admin/staff)' })
  async update(@Param('id') id: string, @Body() dto: UpdateQuestionDto) {
    const data = await this.questionsService.update(id, dto);
    return { success: true, data };
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Delete question (admin/staff)' })
  async remove(@Param('id') id: string) {
    const data = await this.questionsService.remove(id);
    return { success: true, data };
  }
}
