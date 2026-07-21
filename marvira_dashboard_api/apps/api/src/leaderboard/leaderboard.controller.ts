import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../common/decorators/roles.decorator';
import { ProgressService } from '../progress/progress.service';

@ApiTags('leaderboard')
@Controller('leaderboard')
export class LeaderboardController {
  constructor(private readonly progressService: ProgressService) {}

  @Public()
  @Get('global')
  @ApiOperation({
    summary: 'Global leaderboard (total score across completed events)',
  })
  async global(@Query('limit') limit?: string) {
    const data = await this.progressService.getGlobalLeaderboard(
      parseInt(limit || '50', 10),
    );
    return { success: true, data };
  }
}
