import { Controller, Get, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { ProgressService } from '../progress/progress.service';
import { RequestUser } from '../common/types/request-user';

@ApiTags('profile')
@Controller('profile')
export class ProfileController {
  constructor(
    private readonly usersService: UsersService,
    private readonly progressService: ProgressService,
  ) {}

  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user profile' })
  async profile(@Req() req: { user: RequestUser }) {
    const data = await this.usersService.getProfile(req.user.id);
    return { success: true, data };
  }

  @Get('completed-events')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get completed events' })
  async completedEvents(@Req() req: { user: RequestUser }) {
    const data = await this.progressService.getCompletedEvents(req.user.id);
    return { success: true, data };
  }
}
