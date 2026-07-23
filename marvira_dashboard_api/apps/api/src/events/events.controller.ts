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
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { EventsService } from './events.service';
import { EventOwnershipService } from './event-ownership.service';
import { EventAccessService } from './event-access.service';
import {
  CreateEventDto,
  UpdateEventDto,
  NearbyQueryDto,
  JoinEventDto,
} from './dto/event.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { Public } from '../common/decorators/roles.decorator';
import { RequestUser } from '../common/types/request-user';
import { ProgressService } from '../progress/progress.service';
import { QuestionsService } from '../questions/questions.service';
import { LinkQuestionToEventDto } from '../questions/dto/question.dto';

@ApiTags('events')
@Controller('events')
export class EventsController {
  constructor(
    private readonly eventsService: EventsService,
    private readonly progressService: ProgressService,
    private readonly ownershipService: EventOwnershipService,
    private readonly questionsService: QuestionsService,
    private readonly eventAccessService: EventAccessService,
  ) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'List active events' })
  async findAll(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    const data = await this.eventsService.findAll(
      parseInt(page || '1', 10),
      parseInt(pageSize || '20', 10),
    );
    return { success: true, data };
  }

  @Public()
  @Get('nearby')
  @ApiOperation({ summary: 'Find nearby events using PostGIS' })
  async nearby(@Query() query: NearbyQueryDto) {
    const data = await this.eventsService.findNearby(
      query.latitude,
      query.longitude,
      query.radiusKm,
    );
    return { success: true, data };
  }

  @Get('mine')
  @Roles(UserRole.USER, UserRole.STAFF, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List events created by the current user' })
  async findMine(
    @Req() req: { user: RequestUser },
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    const data = await this.eventsService.findByCreator(
      req.user.id,
      parseInt(page || '1', 10),
      parseInt(pageSize || '20', 10),
    );
    return { success: true, data };
  }

  @Public()
  @Get(':id/leaderboard')
  @ApiOperation({
    summary: 'Event completion leaderboard (score, then fastest time)',
  })
  async leaderboard(@Param('id') id: string, @Query('limit') limit?: string) {
    const data = await this.progressService.getEventLeaderboard(
      id,
      parseInt(limit || '50', 10),
    );
    return { success: true, data };
  }

  @Get(':id/completion')
  @Roles(UserRole.USER, UserRole.STAFF, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Re-open completion / gift snapshot for a finished event',
  })
  async completion(@Param('id') id: string, @Req() req: { user: RequestUser }) {
    const data = await this.progressService.getEventCompletion(req.user.id, id);
    return { success: true, data };
  }

  @Get(':id/finishers')
  @Roles(UserRole.USER, UserRole.STAFF, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'List finishers with gift assignment (owner or staff)',
  })
  async finishers(@Param('id') id: string, @Req() req: { user: RequestUser }) {
    await this.ownershipService.assertCanManage(id, req.user);
    const data = await this.progressService.getEventFinishers(id);
    return { success: true, data };
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get event by ID' })
  async findOne(@Param('id') id: string, @Req() req: { user?: RequestUser }) {
    const data = await this.eventsService.findOne(id, req.user?.id);
    return { success: true, data };
  }

  @Post(':id/join')
  @Roles(UserRole.USER, UserRole.STAFF, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Join a password-protected event' })
  async join(
    @Param('id') id: string,
    @Body() dto: JoinEventDto,
    @Req() req: { user: RequestUser },
  ) {
    const data = await this.eventAccessService.joinEvent(
      req.user.id,
      id,
      dto.password,
    );
    return { success: true, data };
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.STAFF, UserRole.USER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create event (draft)' })
  async create(@Body() dto: CreateEventDto, @Req() req: { user: RequestUser }) {
    const data = await this.eventsService.create({
      ...dto,
      createdBy: req.user.id,
    });
    return { success: true, data };
  }

  @Post(':eventId/questions')
  @Roles(UserRole.ADMIN, UserRole.STAFF, UserRole.USER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Link a question to an event' })
  async linkQuestion(
    @Param('eventId') eventId: string,
    @Body() dto: LinkQuestionToEventDto,
    @Req() req: { user: RequestUser },
  ) {
    await this.ownershipService.assertCanManage(eventId, req.user);
    const data = await this.questionsService.linkToEvent(
      eventId,
      dto.questionId,
      dto.orderIndex,
    );
    return { success: true, data };
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.STAFF, UserRole.USER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update event' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateEventDto,
    @Req() req: { user: RequestUser },
  ) {
    const data = await this.eventsService.updateForUser(
      id,
      req.user.id,
      req.user.role,
      dto,
    );
    return { success: true, data };
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.STAFF, UserRole.USER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete event' })
  async remove(@Param('id') id: string, @Req() req: { user: RequestUser }) {
    const data = await this.eventsService.removeForUser(
      id,
      req.user.id,
      req.user.role,
    );
    return { success: true, data };
  }
}
