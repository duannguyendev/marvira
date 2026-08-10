import {
  Controller,
  Get,
  Param,
  Post,
  Body,
  Query,
  Patch,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { RequestUser } from '../common/types/request-user';
import { UserModerationService } from './user-moderation.service';
import { ModerationReasonDto, SuspendPlayDto } from './dto/moderation.dto';
import { Req } from '@nestjs/common';

@ApiTags('admin-anticheat')
@Controller('admin/anticheat')
@Roles(UserRole.ADMIN)
@ApiBearerAuth()
export class AnticheatAdminController {
  constructor(private readonly moderation: UserModerationService) {}

  @Get('users')
  @ApiOperation({
    summary:
      'List flagged users (warning points >= 1 by default, highest first)',
  })
  async listUsers(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('search') search?: string,
    @Query('minWarningPoints') minWarningPoints?: string,
    @Query('suspendedOnly') suspendedOnly?: string,
  ) {
    const parsedMin =
      minWarningPoints != null && minWarningPoints !== ''
        ? parseInt(minWarningPoints, 10)
        : 1;
    const data = await this.moderation.listFlaggedUsers(
      parseInt(page || '1', 10),
      parseInt(pageSize || '20', 10),
      search,
      Number.isFinite(parsedMin) ? parsedMin : 1,
      suspendedOnly === 'true',
    );
    return { success: true, data };
  }

  @Get('users/:id')
  @ApiOperation({ summary: 'Get user anti-cheat detail' })
  async getUser(@Param('id') id: string) {
    const data = await this.moderation.getUserDetail(id);
    return { success: true, data };
  }

  @Get('users/:id/warnings')
  @ApiOperation({ summary: 'List location warnings for user' })
  async listWarnings(
    @Param('id') id: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    const data = await this.moderation.listWarnings(
      id,
      parseInt(page || '1', 10),
      parseInt(pageSize || '20', 10),
    );
    return { success: true, data };
  }

  @Post('users/:id/suspend')
  @ApiOperation({ summary: 'Suspend user from playing' })
  async suspend(
    @Param('id') id: string,
    @Body() dto: SuspendPlayDto,
    @Req() req: { user: RequestUser },
  ) {
    const data = await this.moderation.suspendPlay(
      id,
      req.user.id,
      dto.duration,
      dto.reason,
    );
    return { success: true, data };
  }

  @Post('users/:id/lift-suspension')
  @ApiOperation({ summary: 'Lift play suspension' })
  async liftSuspension(
    @Param('id') id: string,
    @Body() dto: ModerationReasonDto,
    @Req() req: { user: RequestUser },
  ) {
    const data = await this.moderation.liftSuspension(
      id,
      req.user.id,
      dto.reason,
    );
    return { success: true, data };
  }

  @Post('users/:id/reset-warnings')
  @ApiOperation({ summary: 'Reset warning points to zero' })
  async resetWarnings(
    @Param('id') id: string,
    @Body() dto: ModerationReasonDto,
    @Req() req: { user: RequestUser },
  ) {
    const data = await this.moderation.resetWarningPoints(
      id,
      req.user.id,
      dto.reason,
    );
    return { success: true, data };
  }

  @Patch('users/:id/deactivate')
  @ApiOperation({ summary: 'Deactivate user account' })
  async deactivate(
    @Param('id') id: string,
    @Body() dto: ModerationReasonDto,
    @Req() req: { user: RequestUser },
  ) {
    const data = await this.moderation.deactivateUser(
      id,
      req.user.id,
      dto.reason,
    );
    return { success: true, data };
  }

  @Patch('users/:id/activate')
  @ApiOperation({ summary: 'Activate user account' })
  async activate(
    @Param('id') id: string,
    @Body() dto: ModerationReasonDto,
    @Req() req: { user: RequestUser },
  ) {
    const data = await this.moderation.activateUser(
      id,
      req.user.id,
      dto.reason,
    );
    return { success: true, data };
  }
}
