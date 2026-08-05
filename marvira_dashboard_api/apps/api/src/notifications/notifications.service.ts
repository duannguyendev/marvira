import { Injectable, Logger, Optional } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import {
  NotificationCategory,
  NotificationType,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UserDevicesService } from './user-devices.service';
import { NotificationPreferencesService } from './notification-preferences.service';
import {
  buildNotificationCopy,
  categoryForType,
} from './notification-copy';

export type CreateNotificationInput = {
  userId: string;
  type: NotificationType;
  title?: string;
  body?: string;
  copyParams?: {
    eventTitle?: string;
    placeTitle?: string;
    score?: number;
    reason?: string;
  };
  data?: Record<string, string | number | boolean | null | undefined>;
  relatedEntityType?: string;
  relatedEntityId?: string;
  dedupeKey?: string;
  category?: NotificationCategory;
};

const DATA_ALLOWLIST = new Set([
  'notificationId',
  'type',
  'eventId',
  'placeId',
  'questionId',
  'reportId',
]);

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly devices: UserDevicesService,
    private readonly preferences: NotificationPreferencesService,
    @Optional()
    @InjectQueue('notifications')
    private notificationsQueue?: Queue,
    @Optional()
    @InjectQueue('analytics')
    private analyticsQueue?: Queue,
  ) {}

  /**
   * Persist inbox row, then enqueue FCM when queue + preference allow.
   * Preference OFF still writes inbox; only skips FCM.
   */
  async createAndEnqueue(input: CreateNotificationInput) {
    const category =
      input.category ??
      (categoryForType(input.type) as NotificationCategory);

    const locale = await this.devices.resolveLocale(input.userId);
    const copy =
      input.title && input.body
        ? { title: input.title, body: input.body }
        : buildNotificationCopy(input.type, locale, input.copyParams ?? {});

    const title = copy.title.slice(0, 200);
    const body = copy.body.slice(0, 1000);

    let notification;
    try {
      notification = await this.prisma.client.notification.create({
        data: {
          userId: input.userId,
          type: input.type,
          category,
          title,
          body,
          data: {} as Prisma.InputJsonValue,
          dedupeKey: input.dedupeKey,
          relatedEntityType: input.relatedEntityType,
          relatedEntityId: input.relatedEntityId,
        },
      });
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002' &&
        input.dedupeKey
      ) {
        const existing = await this.prisma.client.notification.findFirst({
          where: { userId: input.userId, dedupeKey: input.dedupeKey },
        });
        if (existing) {
          this.logger.debug(
            `dedupe hit ${input.dedupeKey} → ${existing.id}`,
          );
          return existing;
        }
      }
      throw err;
    }

    const dataPayload = this.sanitizeData({
      notificationId: notification.id,
      type: input.type,
      ...input.data,
    });

    notification = await this.prisma.client.notification.update({
      where: { id: notification.id },
      data: { data: dataPayload as Prisma.InputJsonValue },
    });

    const pushEnabled = await this.preferences.isPushEnabled(
      input.userId,
      category,
    );
    if (!pushEnabled) {
      this.logger.debug(
        `inbox saved, FCM skipped (pref off): ${input.type} → ${input.userId}`,
      );
      return notification;
    }

    if (!this.notificationsQueue) {
      this.logger.debug(
        `inbox saved, FCM skipped (no queue): ${input.type} → ${input.userId}`,
      );
      return notification;
    }

    await this.notificationsQueue.add(
      'send',
      { notificationId: notification.id },
      {
        removeOnComplete: 100,
        removeOnFail: 100,
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
      },
    );

    return notification;
  }

  /** @deprecated Prefer createAndEnqueue — kept for transitional call sites */
  async sendNotification(userId: string, message: string, type: string) {
    const mapped = this.mapLegacyType(type);
    if (!mapped) {
      this.logger.warn(`Unknown legacy notification type: ${type}`);
      return;
    }
    await this.createAndEnqueue({
      userId,
      type: mapped,
      title: this.legacyTitle(mapped),
      body: message,
    });
  }

  async trackEvent(eventName: string, payload: Record<string, unknown>) {
    if (!this.analyticsQueue) {
      this.logger.debug(`skip analytics (no queue): ${eventName}`);
      return;
    }
    await this.analyticsQueue.add('track', { eventName, payload });
  }

  private sanitizeData(
    raw: Record<string, string | number | boolean | null | undefined>,
  ): Record<string, string> {
    const out: Record<string, string> = {};
    for (const [key, value] of Object.entries(raw)) {
      if (!DATA_ALLOWLIST.has(key)) continue;
      if (value == null) continue;
      out[key] = String(value);
    }
    return out;
  }

  private mapLegacyType(type: string): NotificationType | null {
    switch (type) {
      case 'event_completed':
        return NotificationType.EVENT_COMPLETED;
      case 'wrong_answer_report':
        return NotificationType.WRONG_ANSWER_REPORT;
      case 'answer_updated':
        return NotificationType.ANSWER_UPDATED;
      case 'scheduled_publish_failed':
        return NotificationType.SCHEDULED_PUBLISH_FAILED;
      default:
        return null;
    }
  }

  private legacyTitle(type: NotificationType): string {
    switch (type) {
      case NotificationType.EVENT_COMPLETED:
        return 'Hunt completed!';
      case NotificationType.WRONG_ANSWER_REPORT:
        return 'Answer report';
      case NotificationType.ANSWER_UPDATED:
        return 'Answer updated';
      case NotificationType.SCHEDULED_PUBLISH_FAILED:
        return 'Scheduled publish failed';
      default:
        return 'Marvira';
    }
  }
}
