import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { PracticeService } from './practice.service';
import { SubmitTrainingAnswerDto } from './dto/practice.dto';
import {
  CreateQuestionDto,
  UpdateQuestionDto,
} from '../questions/dto/question.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { RequestUser } from '../common/types/request-user';

@ApiTags('practice')
@Controller('practice')
@ApiBearerAuth()
@Roles(UserRole.USER, UserRole.STAFF, UserRole.ADMIN)
export class PracticeController {
  constructor(private readonly practiceService: PracticeService) {}

  @Get('questions')
  @ApiOperation({
    summary: 'List practice questions (unfinished or completed)',
  })
  async list(
    @Req() req: { user: RequestUser },
    @Query('status') status?: 'unfinished' | 'completed',
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('language') language?: string,
  ) {
    const data = await this.practiceService.listPracticeQuestions(
      req.user.id,
      status === 'completed' ? 'completed' : 'unfinished',
      parseInt(page || '1', 10),
      parseInt(pageSize || '50', 10),
      language,
    );
    return { success: true, data: data.items };
  }

  @Get('questions/mine')
  @ApiOperation({ summary: 'List questions created by current user' })
  async mine(@Req() req: { user: RequestUser }) {
    const data = await this.practiceService.findMine(req.user.id);
    return { success: true, data };
  }

  @Get('questions/:id')
  @ApiOperation({ summary: 'Get practice question for training' })
  async getOne(@Req() req: { user: RequestUser }, @Param('id') id: string) {
    const data = await this.practiceService.getQuestionForTraining(
      req.user.id,
      id,
    );
    return { success: true, data };
  }

  @Post('questions/:id/answer')
  @ApiOperation({ summary: 'Submit training answer' })
  async submitAnswer(
    @Req() req: { user: RequestUser },
    @Param('id') id: string,
    @Body() dto: SubmitTrainingAnswerDto,
  ) {
    const data = await this.practiceService.submitAnswer(
      req.user.id,
      id,
      dto.answer,
    );
    return { success: true, data };
  }

  @Post('questions')
  @ApiOperation({ summary: 'Create standalone community practice question' })
  async create(
    @Req() req: { user: RequestUser },
    @Body() dto: CreateQuestionDto,
  ) {
    const created = await this.practiceService.createCommunityQuestion(
      req.user.id,
      dto,
    );
    const data = await this.practiceService.getQuestionForTraining(
      req.user.id,
      created.id,
    );
    return { success: true, data };
  }

  @Patch('questions/:id')
  @ApiOperation({ summary: 'Update own community question' })
  async update(
    @Req() req: { user: RequestUser },
    @Param('id') id: string,
    @Body() dto: UpdateQuestionDto,
  ) {
    const data = await this.practiceService.updateCommunityQuestion(
      req.user.id,
      id,
      dto,
    );
    return { success: true, data };
  }

  @Delete('questions/:id')
  @ApiOperation({ summary: 'Delete own community question' })
  async remove(@Req() req: { user: RequestUser }, @Param('id') id: string) {
    await this.practiceService.deleteCommunityQuestion(req.user.id, id);
    return { success: true, data: null };
  }
}
