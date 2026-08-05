import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { UserDevicesService } from './user-devices.service';
import { FcmSenderService } from './fcm-sender.service';

@Processor('notifications')
export class NotificationsProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationsProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly devices: UserDevicesService,
    private readonly fcm: FcmSenderService,
  ) {
    super();
  }

  async process(job: Job<{ notificationId?: string; userId?: string; message?: string; type?: string }>) {
    const notificationId = job.data.notificationId;
    if (!notificationId) {
      this.logger.warn(
        `Legacy/no-id notification job skipped: ${JSON.stringify(job.data)}`,
      );
      return { sent: false, reason: 'missing_notification_id' };
    }

    const notification = await this.prisma.client.notification.findUnique({
      where: { id: notificationId },
    });
    if (!notification) {
      return { sent: false, reason: 'not_found' };
    }

    const deviceRows = await this.devices.listTokens(notification.userId);
    if (!deviceRows.length) {
      this.logger.debug(`No devices for user ${notification.userId}`);
      return { sent: false, reason: 'no_devices' };
    }

    const data =
      notification.data &&
      typeof notification.data === 'object' &&
      !Array.isArray(notification.data)
        ? (notification.data as Record<string, unknown>)
        : {};

    const stringData: Record<string, string> = {};
    for (const [k, v] of Object.entries(data)) {
      if (v != null) stringData[k] = String(v);
    }

    const { successCount, invalidTokens } = await this.fcm.sendToTokens(
      deviceRows.map(d => d.fcmToken),
      {
        title: notification.title,
        body: notification.body,
        data: stringData,
      },
    );

    if (invalidTokens.length) {
      await this.devices.deleteTokens(invalidTokens);
      this.logger.log(`Pruned ${invalidTokens.length} invalid FCM token(s)`);
    }

    this.logger.log(
      `FCM for ${notificationId}: ${successCount}/${deviceRows.length} ok`,
    );
    return { sent: true, successCount, pruned: invalidTokens.length };
  }
}

@Processor('analytics')
export class AnalyticsProcessor extends WorkerHost {
  private readonly logger = new Logger(AnalyticsProcessor.name);

  async process(
    job: Job<{ eventName: string; payload: Record<string, unknown> }>,
  ) {
    this.logger.log(`Analytics event: ${job.data.eventName}`);
    return { processed: true };
  }
}

@Processor('image-processing')
export class ImageProcessingProcessor extends WorkerHost {
  private readonly logger = new Logger(ImageProcessingProcessor.name);

  async process(job: Job<{ filename: string }>) {
    this.logger.log(`Processing image: ${job.data.filename}`);
    return { processed: true };
  }
}
