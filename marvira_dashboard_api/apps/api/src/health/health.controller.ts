import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from '../common/decorators/roles.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../common/redis/redis.service';

@ApiTags('health')
@Controller()
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  @Public()
  @Get('health')
  @ApiOperation({ summary: 'Liveness probe' })
  health() {
    return { success: true, status: 'ok' };
  }

  @Public()
  @Get('ready')
  @ApiOperation({
    summary: 'Readiness probe — checks DB, Redis, and pending migrations',
  })
  async ready() {
    await this.prisma.client.$queryRaw`SELECT 1`;
    await this.redis.set('health:ping', '1', 10);

    const columns = await this.prisma.client.$queryRaw<
      Array<{ column_name: string }>
    >`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND (
          (table_name = 'user_place_completion' AND column_name IN ('unlocked_at', 'answer_duration_ms'))
          OR (table_name = 'user_event_progress' AND column_name = 'total_duration_ms')
        )
    `;
    const found = new Set(columns.map(c => c.column_name));
    const required = [
      'unlocked_at',
      'answer_duration_ms',
      'total_duration_ms',
    ] as const;
    const missing = required.filter(name => !found.has(name));
    if (missing.length > 0) {
      throw new ServiceUnavailableException({
        success: false,
        status: 'not_ready',
        message: `Pending database migration: missing columns ${missing.join(', ')}. Run pnpm db:migrate.`,
      });
    }

    return { success: true, status: 'ready' };
  }
}
