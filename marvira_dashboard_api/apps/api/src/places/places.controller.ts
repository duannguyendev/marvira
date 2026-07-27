import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { PlacesService } from './places.service';
import { PlaceAnswerReportService } from './place-answer-report.service';
import { ProgressService } from '../progress/progress.service';
import { QuestionsService } from '../questions/questions.service';
import { EventOwnershipService } from '../events/event-ownership.service';
import {
  CreatePlaceDto,
  UpdatePlaceDto,
  UnlockPlaceDto,
  AnswerPlaceDto,
} from './dto/place.dto';
import { Roles, Public } from '../common/decorators/roles.decorator';
import { RequestUser } from '../common/types/request-user';

@ApiTags('places')
@Controller()
export class PlacesController {
  constructor(
    private readonly placesService: PlacesService,
    private readonly progressService: ProgressService,
    private readonly questionsService: QuestionsService,
    private readonly ownershipService: EventOwnershipService,
    private readonly reportService: PlaceAnswerReportService,
  ) {}

  @Public()
  @Get('events/:eventId/places')
  @ApiOperation({ summary: 'Get places for an event' })
  async findByEvent(
    @Param('eventId') eventId: string,
    @Req() req: { user?: RequestUser },
  ) {
    const data = await this.placesService.findByEvent(eventId, req.user?.id);
    return { success: true, data };
  }

  @Post('places')
  @Roles(UserRole.ADMIN, UserRole.STAFF, UserRole.USER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create place' })
  async create(@Body() dto: CreatePlaceDto, @Req() req: { user: RequestUser }) {
    await this.ownershipService.assertCanManage(dto.eventId, req.user);
    const data = await this.placesService.create(dto);
    return { success: true, data };
  }

  @Patch('places/:id')
  @Roles(UserRole.ADMIN, UserRole.STAFF, UserRole.USER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update place' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdatePlaceDto,
    @Req() req: { user: RequestUser },
  ) {
    await this.ownershipService.assertCanManagePlace(id, req.user);
    const data = await this.placesService.update(id, dto);
    return { success: true, data };
  }

  @Delete('places/:id')
  @Roles(UserRole.ADMIN, UserRole.STAFF, UserRole.USER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete place' })
  async remove(@Param('id') id: string, @Req() req: { user: RequestUser }) {
    await this.ownershipService.assertCanManagePlace(id, req.user);
    const data = await this.placesService.remove(id);
    return { success: true, data };
  }

  @Post('places/:id/unlock')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Unlock place with GPS validation' })
  async unlock(
    @Param('id') id: string,
    @Body() dto: UnlockPlaceDto,
    @Req() req: { user: RequestUser },
  ) {
    const result = await this.progressService.unlockPlace(req.user.id, id, dto);
    const { warnings, ...data } = result;
    return { success: true, data, warnings: warnings ?? [] };
  }

  @Get('places/:id/question')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get question for unlocked place' })
  async getQuestion(
    @Param('id') id: string,
    @Req() req: { user: RequestUser },
  ) {
    const data = await this.questionsService.getQuestionForPlace(
      req.user.id,
      id,
    );
    return { success: true, data };
  }

  @Post('places/:id/answer')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Submit answer for place' })
  async answer(
    @Param('id') id: string,
    @Body() dto: AnswerPlaceDto,
    @Req() req: { user: RequestUser },
  ) {
    const result = await this.progressService.submitAnswer(
      req.user.id,
      id,
      dto,
    );
    const { warnings, ...data } = result;
    return { success: true, data, warnings: warnings ?? [] };
  }

  @Post('places/:id/report-wrong-answer')
  @Roles(UserRole.USER, UserRole.STAFF, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Report a possibly wrong answer at this place' })
  async reportWrongAnswer(
    @Param('id') id: string,
    @Req() req: { user: RequestUser },
  ) {
    const data = await this.reportService.reportWrongAnswer(req.user.id, id);
    return { success: true, data };
  }
}
