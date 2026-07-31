import { Injectable, Logger, Optional } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @Optional()
    @InjectQueue('notifications')
    private notificationsQueue?: Queue,
    @Optional()
    @InjectQueue('analytics')
    private analyticsQueue?: Queue,
  ) {}

  async sendNotification(userId: string, message: string, type: string) {
    if (!this.notificationsQueue) {
      this.logger.debug(
        `skip notification (no queue): ${type} → ${userId}: ${message}`,
      );
      return;
    }
    await this.notificationsQueue.add('send', { userId, message, type });
  }

  async trackEvent(eventName: string, payload: Record<string, unknown>) {
    if (!this.analyticsQueue) {
      this.logger.debug(`skip analytics (no queue): ${eventName}`);
      return;
    }
    await this.analyticsQueue.add('track', { eventName, payload });
  }
}
