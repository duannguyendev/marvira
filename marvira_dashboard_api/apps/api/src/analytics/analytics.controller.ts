import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { AnalyticsService } from './analytics.service';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('analytics')
@Controller('analytics')
@Roles(UserRole.ADMIN, UserRole.STAFF)
@ApiBearerAuth()
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('overview')
  @ApiOperation({ summary: 'Analytics overview' })
  async overview() {
    const data = await this.analyticsService.getOverview();
    return { success: true, data };
  }

  @Get('events')
  @ApiOperation({ summary: 'Per-event analytics' })
  async events() {
    const data = await this.analyticsService.getEventAnalytics();
    return { success: true, data };
  }

  @Get('engagement')
  @ApiOperation({ summary: 'Engagement chart data' })
  async engagement() {
    const data = await this.analyticsService.getEngagementChart();
    return { success: true, data };
  }

  @Get('activity')
  @ApiOperation({ summary: 'Daily activity chart data' })
  async activity() {
    const data = await this.analyticsService.getActivityByDay();
    return { success: true, data };
  }
}
