import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectQueue('notifications') private notificationsQueue: Queue,
    @InjectQueue('analytics') private analyticsQueue: Queue,
  ) {}

  async sendNotification(userId: string, message: string, type: string) {
    await this.notificationsQueue.add('send', { userId, message, type });
  }

  async trackEvent(eventName: string, payload: Record<string, unknown>) {
    await this.analyticsQueue.add('track', { eventName, payload });
  }
}
