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
import { FcmSenderService } from './fcm-sender.service';
import { UserDevicesService } from './user-devices.service';
import { NotificationsInboxService } from './notifications-inbox.service';
import { NotificationPreferencesService } from './notification-preferences.service';
import {
  DevicesController,
  NotificationsController,
} from './notifications.controller';

const redisDisabled = process.env.REDIS_DISABLED === 'true';
/** Stub log-only queues — off by default (Upstash free-tier friendly). */
const stubQueuesEnabled = process.env.BULL_STUB_QUEUES === 'true';
/** Real FCM worker — on whenever Redis is available. */
const notificationsQueueEnabled = !redisDisabled;

@Module({
  imports: [
    PrismaModule,
    ...(notificationsQueueEnabled
      ? [BullModule.registerQueue({ name: 'notifications' })]
      : []),
    ...(!redisDisabled && stubQueuesEnabled
      ? [
          BullModule.registerQueue(
            { name: 'analytics' },
            { name: 'image-processing' },
          ),
        ]
      : []),
  ],
  controllers: [DevicesController, NotificationsController],
  providers: [
    NotificationsService,
    SessionCleanupService,
    FcmSenderService,
    UserDevicesService,
    NotificationsInboxService,
    NotificationPreferencesService,
    ...(notificationsQueueEnabled ? [NotificationsProcessor] : []),
    ...(!redisDisabled && stubQueuesEnabled
      ? [AnalyticsProcessor, ImageProcessingProcessor]
      : []),
  ],
  exports: [NotificationsService],
})
export class NotificationsModule {}
