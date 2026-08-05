import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { getQueueToken } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { ModuleRef } from '@nestjs/core';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../common/redis/redis.service';
import {
  scheduledEndJobId,
} from './event-live-duration';
import { AppSettingsService } from '../settings/app-settings.service';
import { NotificationsService } from '../notifications/notifications.service';

const QUEUE_NAME = 'event-publish';
const SAFETY_INTERVAL_MS = 60_000;

@Injectable()
export class EventEndService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(EventEndService.name);
  private safetyTimer: ReturnType<typeof setInterval> | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly moduleRef: ModuleRef,
    private readonly appSettings: AppSettingsService,
  ) {}

  async onModuleInit() {
    this.safetyTimer = setInterval(() => {
      void this.endDueEvents().catch(err =>
        this.logger.warn(`End safety poll failed: ${err}`),
      );
    }, SAFETY_INTERVAL_MS);
    this.logger.log('Event auto-end safety poll started');
  }

  onModuleDestroy() {
    if (this.safetyTimer) {
      clearInterval(this.safetyTimer);
      this.safetyTimer = null;
    }
  }

  /** Called when an event goes live (immediate or scheduled publish). */
  async scheduleAutoEnd(eventId: string, endsAt?: Date) {
    const at = endsAt ?? (await this.appSettings.computeEndsAt());
    const updated = await this.prisma.client.event.update({
      where: { id: eventId },
      data: {
        endsAt: at,
        endedAt: null,
      },
    });
    await this.invalidateCache();
    await this.enqueueDelayedEnd(eventId, at);
    return updated;
  }

  async endByOwner(eventId: string) {
    const event = await this.prisma.client.event.findUnique({
      where: { id: eventId },
    });
    if (!event) throw new NotFoundException('Event not found');
    if (event.endedAt) {
      throw new BadRequestException('Event is already ended');
    }
    if (!event.isActive) {
      throw new BadRequestException('Only live events can be ended');
    }
    return this.applyEnd(eventId);
  }

  async endIfDue(
    eventId: string,
  ): Promise<{ ended: boolean; reason?: string }> {
    const event = await this.prisma.client.event.findUnique({
      where: { id: eventId },
    });
    if (!event) {
      return { ended: false, reason: 'not_found' };
    }
    if (event.endedAt) {
      await this.removeDelayedJob(eventId);
      return { ended: false, reason: 'already_ended' };
    }
    if (!event.isActive) {
      return { ended: false, reason: 'not_live' };
    }
    if (!event.endsAt) {
      return { ended: false, reason: 'no_ends_at' };
    }
    if (event.endsAt.getTime() > Date.now()) {
      return { ended: false, reason: 'not_due' };
    }

    await this.applyEnd(eventId);
    this.logger.log(`Auto-ended event ${eventId}`);
    return { ended: true };
  }

  async endDueEvents(): Promise<number> {
    const due = await this.prisma.client.event.findMany({
      where: {
        isActive: true,
        endedAt: null,
        endsAt: { lte: new Date() },
      },
      select: { id: true },
      take: 50,
    });

    let ended = 0;
    for (const row of due) {
      const result = await this.endIfDue(row.id);
      if (result.ended) ended += 1;
    }
    return ended;
  }

  /** Self-heal a single event if its endsAt is overdue. */
  async ensureEndedIfDue(eventId: string): Promise<boolean> {
    const event = await this.prisma.client.event.findUnique({
      where: { id: eventId },
      select: { isActive: true, endsAt: true, endedAt: true },
    });
    if (!event || event.endedAt || !event.isActive || !event.endsAt) {
      return !!event?.endedAt;
    }
    if (event.endsAt.getTime() > Date.now()) {
      return false;
    }
    const result = await this.endIfDue(eventId);
    return result.ended;
  }

  async cancelEndJobOnly(eventId: string) {
    await this.removeDelayedJob(eventId);
  }

  private async applyEnd(eventId: string) {
    const updated = await this.prisma.client.event.update({
      where: { id: eventId },
      data: {
        isActive: false,
        endedAt: new Date(),
      },
    });
    await this.invalidateCache();
    await this.removeDelayedJob(eventId);
    await this.notifyEventEnded(
      updated.createdBy,
      eventId,
      updated.title,
    );
    return updated;
  }

  private async notifyEventEnded(
    userId: string,
    eventId: string,
    eventTitle: string,
  ) {
    try {
      const notifications = this.moduleRef.get(NotificationsService, {
        strict: false,
      });
      if (notifications) {
        await notifications.createAndEnqueue({
          userId,
          type: 'EVENT_ENDED',
          copyParams: { eventTitle },
          data: { eventId },
          relatedEntityType: 'event',
          relatedEntityId: eventId,
          dedupeKey: `event_ended:${eventId}`,
        });
      }
    } catch {
      // optional
    }
  }

  private getQueue(): Queue | null {
    try {
      return this.moduleRef.get<Queue>(getQueueToken(QUEUE_NAME), {
        strict: false,
      });
    } catch {
      return null;
    }
  }

  private async enqueueDelayedEnd(eventId: string, at: Date) {
    const queue = this.getQueue();
    if (!queue) {
      this.logger.warn(
        `No event-publish queue; relying on end safety poll for ${eventId}`,
      );
      return;
    }
    await this.removeDelayedJob(eventId);
    const delay = Math.max(0, at.getTime() - Date.now());
    await queue.add(
      'end-scheduled',
      { eventId },
      {
        jobId: scheduledEndJobId(eventId),
        delay,
        removeOnComplete: true,
        removeOnFail: 100,
      },
    );
  }

  private async removeDelayedJob(eventId: string) {
    const queue = this.getQueue();
    if (!queue) return;
    try {
      const job = await queue.getJob(scheduledEndJobId(eventId));
      if (job) await job.remove();
    } catch (err) {
      this.logger.warn(`Could not remove end job for ${eventId}: ${err}`);
    }
  }

  private async invalidateCache() {
    await this.redis.incr('events:list:version');
  }
}
