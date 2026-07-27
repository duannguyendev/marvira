import { Controller, Post, Patch, Delete, Body, Param, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { QuestionsService } from './questions.service';
import { CreateQuestionDto, UpdateQuestionDto } from './dto/question.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { RequestUser } from '../common/types/request-user';

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
  @Roles(UserRole.ADMIN, UserRole.STAFF, UserRole.USER)
  @ApiOperation({ summary: 'Update question (owner, admin, or staff)' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateQuestionDto,
    @Req() req: { user: RequestUser },
  ) {
    const data = await this.questionsService.updateForUser(
      id,
      req.user.id,
      req.user.role,
      dto,
    );
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
