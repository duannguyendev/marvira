import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { UserRole } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { RequestUser } from '../common/types/request-user';
import {
  RegisterDeviceDto,
  UnregisterDeviceDto,
} from './dto/register-device.dto';
import { UpdateNotificationPreferencesDto } from './dto/update-preferences.dto';
import { UserDevicesService } from './user-devices.service';
import { NotificationsInboxService } from './notifications-inbox.service';
import { NotificationPreferencesService } from './notification-preferences.service';

@ApiTags('devices')
@Controller('devices')
@ApiBearerAuth()
@Roles(UserRole.USER, UserRole.STAFF, UserRole.ADMIN)
export class DevicesController {
  constructor(private readonly devices: UserDevicesService) {}

  @Post()
  @Throttle({ short: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: 'Register or refresh FCM device token' })
  async register(
    @Req() req: { user: RequestUser },
    @Body() dto: RegisterDeviceDto,
  ) {
    const data = await this.devices.register(req.user.id, dto);
    return {
      success: true,
      data: {
        id: data.id,
        fcmToken: data.fcmToken,
        platform: data.platform,
        lastSeenAt: data.lastSeenAt.toISOString(),
      },
    };
  }

  @Delete()
  @ApiOperation({ summary: 'Unregister FCM device token for current user' })
  async unregister(
    @Req() req: { user: RequestUser },
    @Body() dto: UnregisterDeviceDto,
  ) {
    await this.devices.unregister(req.user.id, dto.fcmToken);
    return { success: true, data: null };
  }
}

@ApiTags('notifications')
@Controller('notifications')
@ApiBearerAuth()
@Roles(UserRole.USER, UserRole.STAFF, UserRole.ADMIN)
export class NotificationsController {
  constructor(
    private readonly inbox: NotificationsInboxService,
    private readonly preferences: NotificationPreferencesService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List inbox notifications (paginated)' })
  async list(
    @Req() req: { user: RequestUser },
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
    @Query('unreadOnly') unreadOnly?: string,
  ) {
    const data = await this.inbox.list(req.user.id, {
      cursor,
      limit: limit ? Number(limit) : undefined,
      unreadOnly: unreadOnly === 'true' || unreadOnly === '1',
    });
    return { success: true, data };
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Unread notification count' })
  async unreadCount(@Req() req: { user: RequestUser }) {
    const data = await this.inbox.unreadCount(req.user.id);
    return { success: true, data };
  }

  @Get('preferences')
  @ApiOperation({ summary: 'Get notification preferences' })
  async getPreferences(@Req() req: { user: RequestUser }) {
    const data = await this.preferences.getOrCreate(req.user.id);
    return {
      success: true,
      data: {
        gameplayEnabled: data.gameplayEnabled,
        creatorEnabled: data.creatorEnabled,
        productEnabled: data.productEnabled,
      },
    };
  }

  @Post('preferences')
  @ApiOperation({ summary: 'Update notification preferences' })
  async updatePreferences(
    @Req() req: { user: RequestUser },
    @Body() dto: UpdateNotificationPreferencesDto,
  ) {
    const data = await this.preferences.update(req.user.id, dto);
    return {
      success: true,
      data: {
        gameplayEnabled: data.gameplayEnabled,
        creatorEnabled: data.creatorEnabled,
        productEnabled: data.productEnabled,
      },
    };
  }

  @Post('read-all')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  async readAll(@Req() req: { user: RequestUser }) {
    const data = await this.inbox.markAllRead(req.user.id);
    return { success: true, data };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get notification detail' })
  async getOne(@Req() req: { user: RequestUser }, @Param('id') id: string) {
    const data = await this.inbox.getOne(req.user.id, id);
    return { success: true, data };
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark notification as read' })
  async markRead(@Req() req: { user: RequestUser }, @Param('id') id: string) {
    const data = await this.inbox.markRead(req.user.id, id);
    return { success: true, data };
  }
}
