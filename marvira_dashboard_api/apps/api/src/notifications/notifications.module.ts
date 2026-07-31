import '../load-env';
import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsService } from './notifications.service';
import {
  NotificationsProcessor,
  AnalyticsProcessor,
  ImageProcessingProcessor,
  CleanupProcessor,
} from './notifications.processor';

const redisDisabled = process.env.REDIS_DISABLED === 'true';

@Module({
  imports: [
    PrismaModule,
    ...(redisDisabled
      ? []
      : [
          BullModule.registerQueue(
            { name: 'notifications' },
            { name: 'analytics' },
            { name: 'image-processing' },
            { name: 'cleanup' },
          ),
        ]),
  ],
  providers: redisDisabled
    ? [NotificationsService]
    : [
        NotificationsService,
        NotificationsProcessor,
        AnalyticsProcessor,
        ImageProcessingProcessor,
        CleanupProcessor,
      ],
  exports: [NotificationsService],
})
export class NotificationsModule {}
