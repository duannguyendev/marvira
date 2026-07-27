import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  Post,
  Delete,
  Body,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import {
  UserRole,
  FeedbackStatus,
  FeedbackCategory,
  FeedbackSource,
  ArticleStatus,
} from '@prisma/client';
import { UsersService } from '../users/users.service';
import { EventsService } from '../events/events.service';
import { AnalyticsService } from '../analytics/analytics.service';
import { QuestionsService } from '../questions/questions.service';
import { LinkQuestionToEventDto } from '../questions/dto/question.dto';
import { UpdateQuestionDto } from '../questions/dto/question.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { ProgressService } from '../progress/progress.service';
import { PracticeService } from '../practice/practice.service';
import { FeedbackService } from '../feedback/feedback.service';
import { ArticlesService } from '../articles/articles.service';
import {
  CreateArticleDto,
  UpdateArticleDto,
} from '../articles/dto/article.dto';
import { PublishPracticeQuestionDto } from '../practice/dto/admin-practice.dto';
import { UpdateFeedbackDto } from '../feedback/dto/admin-feedback.dto';
import { SetUserRoleDto } from '../users/dto/set-user-role.dto';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { RequestUser } from '../common/types/request-user';
import { PlaceAnswerReportService } from '../places/place-answer-report.service';
import { AppSettingsService } from '../settings/app-settings.service';
import { UpdateAppSettingsDto } from '../settings/dto/update-app-settings.dto';

@ApiTags('admin')
@Controller('admin')
@Roles(UserRole.ADMIN, UserRole.STAFF)
@ApiBearerAuth()
export class AdminController {
  constructor(
    private readonly usersService: UsersService,
    private readonly eventsService: EventsService,
    private readonly analyticsService: AnalyticsService,
    private readonly questionsService: QuestionsService,
    private readonly progressService: ProgressService,
    private readonly practiceService: PracticeService,
    private readonly feedbackService: FeedbackService,
    private readonly articlesService: ArticlesService,
    private readonly reportService: PlaceAnswerReportService,
    private readonly appSettingsService: AppSettingsService,
  ) {}

  @Get('settings')
  @ApiOperation({ summary: 'Get global app settings' })
  async getSettings() {
    const data = await this.appSettingsService.getSettings();
    return { success: true, data };
  }

  @Patch('settings')
  @ApiOperation({ summary: 'Update global app settings' })
  async updateSettings(@Body() dto: UpdateAppSettingsDto) {
    const data = await this.appSettingsService.updateSettings(dto);
    return { success: true, data };
  }

  @Get('users')
  @ApiOperation({ summary: 'List all users' })
  async users(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('search') search?: string,
  ) {
    const data = await this.usersService.findAll(
      parseInt(page || '1', 10),
      parseInt(pageSize || '20', 10),
      search,
    );
    return { success: true, data };
  }

  @Post('users')
  @ApiOperation({
    summary: 'Create a user (admin/staff; only admin may assign ADMIN role)',
  })
  async createUser(
    @Body() dto: CreateUserDto,
    @Req() req: { user: RequestUser },
  ) {
    const data = await this.usersService.create(dto, req.user.role);
    return { success: true, data };
  }

  @Get('events')
  @ApiOperation({ summary: 'List all events including inactive' })
  async events(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('search') search?: string,
  ) {
    const data = await this.eventsService.findAll(
      parseInt(page || '1', 10),
      parseInt(pageSize || '20', 10),
      false,
      search,
    );
    return { success: true, data };
  }

  @Get('answer-reports')
  @ApiOperation({
    summary: 'Wrong-answer report queue (event, place, counts)',
  })
  async answerReports(@Query('limit') limit?: string) {
    const data = await this.reportService.listAdminQueue(
      parseInt(limit || '50', 10),
    );
    return { success: true, data };
  }

  @Get('analytics')
  @ApiOperation({ summary: 'Admin analytics dashboard data' })
  async analytics() {
    const [overview, events, engagement, activity] = await Promise.all([
      this.analyticsService.getOverview(),
      this.analyticsService.getEventAnalytics(),
      this.analyticsService.getEngagementChart(),
      this.analyticsService.getActivityByDay(),
    ]);
    return { success: true, data: { overview, events, engagement, activity } };
  }

  @Patch('users/:id/deactivate')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Deactivate user (admin only)' })
  async deactivate(@Param('id') id: string) {
    const data = await this.usersService.deactivate(id);
    return { success: true, data };
  }

  @Patch('users/:id/activate')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Activate user (admin only)' })
  async activate(@Param('id') id: string) {
    const data = await this.usersService.activate(id);
    return { success: true, data };
  }

  @Patch('users/:id/role')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Set user role (admin only)' })
  async setRole(
    @Param('id') id: string,
    @Body() dto: SetUserRoleDto,
    @Req() req: { user: RequestUser },
  ) {
    const data = await this.usersService.setRole(id, dto.role, req.user.id);
    return { success: true, data };
  }

  @Get('users/:id/progress')
  @ApiOperation({ summary: 'Get user progress' })
  async userProgress(@Param('id') id: string) {
    const data = await this.usersService.getUserProgress(id);
    return { success: true, data };
  }

  @Get('events/:id/participants')
  @ApiOperation({
    summary: 'List users who joined an event (search, sort, pagination)',
  })
  async eventParticipants(
    @Param('id') id: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('search') search?: string,
    @Query('sortBy') sortBy?: string,
  ) {
    const allowed = ['fastest', 'slowest', 'score', 'started', 'name'] as const;
    const sort = allowed.includes(sortBy as (typeof allowed)[number])
      ? (sortBy as (typeof allowed)[number])
      : 'started';
    const data = await this.progressService.getEventParticipants(
      id,
      parseInt(page || '1', 10),
      parseInt(pageSize || '20', 10),
      search,
      sort,
    );
    return { success: true, data };
  }

  @Get('events/:id')
  @ApiOperation({ summary: 'Get event with full question data for admin' })
  async getEvent(@Param('id') id: string) {
    const data = await this.eventsService.findOneAdmin(id);
    return { success: true, data };
  }

  @Get('questions')
  @ApiOperation({ summary: 'List all questions' })
  async questions(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('search') search?: string,
  ) {
    const data = await this.questionsService.findAll(
      parseInt(page || '1', 10),
      parseInt(pageSize || '20', 10),
      search,
    );
    return { success: true, data };
  }

  @Get('questions/:id')
  @ApiOperation({ summary: 'Get question with linked events' })
  async getQuestion(@Param('id') id: string) {
    const data = await this.questionsService.findOneAdmin(id);
    return { success: true, data };
  }

  @Post('events/:eventId/questions')
  @ApiOperation({ summary: 'Link an existing question to an event' })
  async linkQuestion(
    @Param('eventId') eventId: string,
    @Body() dto: LinkQuestionToEventDto,
  ) {
    const data = await this.questionsService.linkToEvent(
      eventId,
      dto.questionId,
      dto.orderIndex,
    );
    return { success: true, data };
  }

  @Delete('events/:eventId/questions/:questionId')
  @ApiOperation({ summary: 'Unlink a question from an event' })
  async unlinkQuestion(
    @Param('eventId') eventId: string,
    @Param('questionId') questionId: string,
  ) {
    const data = await this.questionsService.unlinkFromEvent(
      eventId,
      questionId,
    );
    return { success: true, data };
  }

  @Get('practice/questions')
  @ApiOperation({ summary: 'List community practice questions for moderation' })
  async practiceQuestions(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('search') search?: string,
    @Query('published') published?: string,
  ) {
    const publishedFilter =
      published === 'true' ? true : published === 'false' ? false : undefined;
    const data = await this.practiceService.adminListCommunity(
      parseInt(page || '1', 10),
      parseInt(pageSize || '20', 10),
      search,
      publishedFilter,
    );
    return { success: true, data };
  }

  @Get('practice/stats')
  @ApiOperation({ summary: 'Practice usage statistics' })
  async practiceStats() {
    const data = await this.practiceService.adminStats();
    return { success: true, data };
  }

  @Patch('practice/questions/:id/publish')
  @ApiOperation({ summary: 'Publish or unpublish community question' })
  async publishPracticeQuestion(
    @Param('id') id: string,
    @Body() dto: PublishPracticeQuestionDto,
  ) {
    const data = await this.practiceService.adminSetPublished(
      id,
      dto.isPublished,
    );
    return { success: true, data };
  }

  @Patch('practice/questions/:id')
  @ApiOperation({ summary: 'Admin update community practice question' })
  async updatePracticeQuestion(
    @Param('id') id: string,
    @Body() dto: UpdateQuestionDto,
  ) {
    const data = await this.questionsService.update(id, dto);
    return { success: true, data };
  }

  @Delete('practice/questions/:id')
  @ApiOperation({ summary: 'Admin delete community practice question' })
  async deletePracticeQuestion(@Param('id') id: string) {
    const data = await this.questionsService.remove(id);
    return { success: true, data };
  }

  @Get('feedback')
  @ApiOperation({ summary: 'List user feedback messages' })
  async feedbackList(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('category') category?: string,
    @Query('source') source?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    const data = await this.feedbackService.findAll(
      parseInt(page || '1', 10),
      parseInt(pageSize || '20', 10),
      search,
      status as FeedbackStatus | undefined,
      category as FeedbackCategory | undefined,
      source as FeedbackSource | undefined,
      dateFrom,
      dateTo,
    );
    return { success: true, data };
  }

  @Get('feedback/:id')
  @ApiOperation({ summary: 'Get feedback message detail' })
  async feedbackDetail(@Param('id') id: string) {
    const data = await this.feedbackService.findOne(id);
    return { success: true, data };
  }

  @Patch('feedback/:id')
  @ApiOperation({ summary: 'Update feedback status or admin note' })
  async feedbackUpdate(
    @Param('id') id: string,
    @Body() dto: UpdateFeedbackDto,
  ) {
    const data = await this.feedbackService.update(id, dto);
    return { success: true, data };
  }

  @Get('articles')
  @ApiOperation({ summary: 'List marketing articles (all statuses)' })
  async articlesList(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
  ) {
    const data = await this.articlesService.findAllAdmin(
      parseInt(page || '1', 10),
      parseInt(pageSize || '20', 10),
      search,
      status as ArticleStatus | undefined,
    );
    return { success: true, data };
  }

  @Get('articles/:id')
  @ApiOperation({ summary: 'Get a marketing article by id' })
  async articleDetail(@Param('id') id: string) {
    const data = await this.articlesService.findOneAdmin(id);
    return { success: true, data };
  }

  @Post('articles')
  @ApiOperation({ summary: 'Create a marketing article' })
  async articleCreate(
    @Body() dto: CreateArticleDto,
    @Req() req: { user: RequestUser },
  ) {
    const data = await this.articlesService.create(dto, req.user.id);
    return { success: true, data };
  }

  @Patch('articles/:id')
  @ApiOperation({ summary: 'Update a marketing article' })
  async articleUpdate(@Param('id') id: string, @Body() dto: UpdateArticleDto) {
    const data = await this.articlesService.update(id, dto);
    return { success: true, data };
  }

  @Delete('articles/:id')
  @ApiOperation({ summary: 'Delete a marketing article' })
  async articleDelete(@Param('id') id: string) {
    const data = await this.articlesService.remove(id);
    return { success: true, data };
  }
}
