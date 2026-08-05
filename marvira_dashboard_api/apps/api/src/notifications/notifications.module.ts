import '../load-env';
import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsService } from './notifications.service';
import {
  NotificationsProcessor,
  AnalyticsProcessor,
  ImageProcessingProcessor,
} from './notifications.processor';
import { SessionCleanupService } from './session-cleanup.service';

const redisDisabled = process.env.REDIS_DISABLED === 'true';
/** Stub log-only queues — off by default (Upstash free-tier friendly). */
const stubQueuesEnabled = process.env.BULL_STUB_QUEUES === 'true';

@Module({
  imports: [
    PrismaModule,
    ...(!redisDisabled && stubQueuesEnabled
      ? [
          BullModule.registerQueue(
            { name: 'notifications' },
            { name: 'analytics' },
            { name: 'image-processing' },
          ),
        ]
      : []),
  ],
  providers: [
    NotificationsService,
    SessionCleanupService,
    ...(!redisDisabled && stubQueuesEnabled
      ? [
          NotificationsProcessor,
          AnalyticsProcessor,
          ImageProcessingProcessor,
        ]
      : []),
  ],
  exports: [NotificationsService],
})
export class NotificationsModule {}
