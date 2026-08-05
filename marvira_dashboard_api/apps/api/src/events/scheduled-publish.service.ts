import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleDestroy,
  OnModuleInit,
  forwardRef,
} from '@nestjs/common';
import { getQueueToken } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { ModuleRef } from '@nestjs/core';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../common/redis/redis.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PublishVerifyService } from './publish-verify.service';
import { EventEndService } from './event-end.service';

const QUEUE_NAME = 'event-publish';
const SAFETY_INTERVAL_MS = 60_000;

export function scheduledPublishJobId(eventId: string) {
  // BullMQ custom jobId cannot contain ':'
  return `event-publish-${eventId}`;
}

@Injectable()
export class ScheduledPublishService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ScheduledPublishService.name);
  private safetyTimer: ReturnType<typeof setInterval> | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly publishVerify: PublishVerifyService,
    private readonly moduleRef: ModuleRef,
    @Inject(forwardRef(() => EventEndService))
    private readonly eventEnd: EventEndService,
  ) {}

  async onModuleInit() {
    // Backup safety poll (also covers REDIS_DISABLED). Primary path is delayed Bull jobs.
    this.safetyTimer = setInterval(() => {
      void this.activateDueEvents().catch(err =>
        this.logger.warn(`Safety poll failed: ${err}`),
      );
    }, SAFETY_INTERVAL_MS);
    this.logger.log('Scheduled publish safety poll started');
  }

  onModuleDestroy() {
    if (this.safetyTimer) {
      clearInterval(this.safetyTimer);
      this.safetyTimer = null;
    }
  }

  async schedulePublish(
    eventId: string,
    scheduledPublishAt: Date,
    options?: {
      publishReviewConfirmed?: boolean;
      actorRole?: string;
      allowChecklistBypass?: boolean;
    },
  ) {
    if (Number.isNaN(scheduledPublishAt.getTime())) {
      throw new BadRequestException('Invalid scheduledPublishAt');
    }
    if (scheduledPublishAt.getTime() <= Date.now()) {
      throw new BadRequestException(
        'scheduledPublishAt must be a future time (UTC)',
      );
    }

    const event = await this.prisma.client.event.findUnique({
      where: { id: eventId },
    });
    if (!event) throw new NotFoundException('Event not found');
    if (event.isActive) {
      throw new BadRequestException('Event is already live');
    }

    await this.validateForGoLive(eventId, options);

    // Persist checklist as verify passes so fire-time validation succeeds
    // (and still invalidates if answers are edited before go-live).
    if (
      options?.allowChecklistBypass &&
      options.publishReviewConfirmed &&
      (options.actorRole === 'ADMIN' || options.actorRole === 'STAFF')
    ) {
      await this.publishVerify.markAllVerifiedFromChecklist(eventId);
    }

    const updated = await this.prisma.client.event.update({
      where: { id: eventId },
      data: {
        isActive: false,
        scheduledPublishAt,
      },
    });
    await this.invalidateCache();
    await this.enqueueDelayedPublish(eventId, scheduledPublishAt);

    return updated;
  }

  async cancelSchedule(eventId: string) {
    const event = await this.prisma.client.event.findUnique({
      where: { id: eventId },
    });
    if (!event) throw new NotFoundException('Event not found');
    if (event.isActive) {
      throw new BadRequestException('Event is already live');
    }

    const updated = await this.prisma.client.event.update({
      where: { id: eventId },
      data: { scheduledPublishAt: null },
    });
    await this.invalidateCache();
    await this.removeDelayedJob(eventId);
    return updated;
  }

  /** Remove delayed job only (e.g. after immediate publish). */
  async cancelScheduleJobOnly(eventId: string) {
    await this.removeDelayedJob(eventId);
  }

  /**
   * Activate a scheduled (or overdue) event. Used by delayed job, safety scan,
   * and read-path self-heal.
   */
  async activateScheduled(
    eventId: string,
    options?: { notifyOnFailure?: boolean },
  ): Promise<{ activated: boolean; reason?: string }> {
    const event = await this.prisma.client.event.findUnique({
      where: { id: eventId },
    });
    if (!event) {
      return { activated: false, reason: 'not_found' };
    }
    if (event.isActive) {
      if (event.scheduledPublishAt) {
        await this.prisma.client.event.update({
          where: { id: eventId },
          data: { scheduledPublishAt: null },
        });
        await this.invalidateCache();
      }
      await this.removeDelayedJob(eventId);
      return { activated: false, reason: 'already_active' };
    }
    if (!event.scheduledPublishAt) {
      return { activated: false, reason: 'not_scheduled' };
    }
    if (event.scheduledPublishAt.getTime() > Date.now()) {
      return { activated: false, reason: 'not_due' };
    }

    try {
      await this.validateForGoLive(eventId);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Publish validation failed';
      this.logger.warn(
        `Scheduled publish blocked for ${eventId}: ${message}`,
      );
      if (options?.notifyOnFailure !== false) {
        await this.notifyCreator(event.createdBy, eventId, event.title, message);
      }
      return { activated: false, reason: 'validation_failed' };
    }

    await this.prisma.client.event.update({
      where: { id: eventId },
      data: {
        isActive: true,
        scheduledPublishAt: null,
        endedAt: null,
      },
    });
    await this.invalidateCache();
    await this.removeDelayedJob(eventId);
    await this.eventEnd
      .scheduleAutoEnd(eventId)
      .catch(err =>
        this.logger.warn(`Failed to schedule auto-end for ${eventId}: ${err}`),
      );
    await this.notifyEventWentLive(event.createdBy, eventId, event.title);
    this.logger.log(`Activated scheduled event ${eventId}`);
    return { activated: true };
  }

  async activateDueEvents(): Promise<number> {
    const due = await this.prisma.client.event.findMany({
      where: {
        isActive: false,
        scheduledPublishAt: { lte: new Date() },
      },
      select: { id: true },
      take: 50,
    });

    let activated = 0;
    for (const row of due) {
      const result = await this.activateScheduled(row.id);
      if (result.activated) activated += 1;
    }
    return activated;
  }

  /** Self-heal a single event if its schedule is overdue. */
  async ensureLiveIfDue(eventId: string): Promise<boolean> {
    const event = await this.prisma.client.event.findUnique({
      where: { id: eventId },
      select: { isActive: true, scheduledPublishAt: true },
    });
    if (!event || event.isActive || !event.scheduledPublishAt) {
      return event?.isActive ?? false;
    }
    if (event.scheduledPublishAt.getTime() > Date.now()) {
      return false;
    }
    const result = await this.activateScheduled(eventId);
    return result.activated;
  }

  private async validateForGoLive(
    eventId: string,
    options?: {
      publishReviewConfirmed?: boolean;
      actorRole?: string;
      allowChecklistBypass?: boolean;
    },
  ) {
    const places = await this.prisma.client.place.findMany({
      where: { eventId },
      select: { id: true, questionId: true },
    });
    if (places.length === 0) {
      throw new BadRequestException(
        'Event must have at least one place before publishing',
      );
    }
    const missing = places.filter(p => !p.questionId);
    if (missing.length > 0) {
      throw new BadRequestException(
        `Each place must have a question before publishing (${missing.length} place(s) missing)`,
      );
    }

    const canUseChecklist =
      options?.allowChecklistBypass === true &&
      options.publishReviewConfirmed === true &&
      (options.actorRole === 'ADMIN' || options.actorRole === 'STAFF');
    if (canUseChecklist) {
      return;
    }
    await this.publishVerify.assertAllVerified(eventId);
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

  private async enqueueDelayedPublish(eventId: string, at: Date) {
    const queue = this.getQueue();
    if (!queue) {
      this.logger.warn(
        `No event-publish queue; relying on safety poll for ${eventId}`,
      );
      return;
    }
    await this.removeDelayedJob(eventId);
    const delay = Math.max(0, at.getTime() - Date.now());
    await queue.add(
      'publish-scheduled',
      { eventId },
      {
        jobId: scheduledPublishJobId(eventId),
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
      const job = await queue.getJob(scheduledPublishJobId(eventId));
      if (job) await job.remove();
    } catch (err) {
      this.logger.warn(`Could not remove delayed job for ${eventId}: ${err}`);
    }
  }

  private async notifyCreator(
    userId: string,
    eventId: string,
    eventTitle: string,
    reason: string,
  ) {
    try {
      const notifications = this.moduleRef.get(NotificationsService, {
        strict: false,
      });
      await notifications.createAndEnqueue({
        userId,
        type: 'SCHEDULED_PUBLISH_FAILED',
        copyParams: { eventTitle, reason },
        data: { eventId },
        relatedEntityType: 'event',
        relatedEntityId: eventId,
        dedupeKey: `sched_fail:${eventId}:${reason.slice(0, 80)}`,
      });
    } catch {
      // Notifications optional when REDIS_DISABLED
    }
  }

  private async notifyEventWentLive(
    userId: string,
    eventId: string,
    eventTitle: string,
  ) {
    try {
      const notifications = this.moduleRef.get(NotificationsService, {
        strict: false,
      });
      await notifications.createAndEnqueue({
        userId,
        type: 'EVENT_WENT_LIVE',
        copyParams: { eventTitle },
        data: { eventId },
        relatedEntityType: 'event',
        relatedEntityId: eventId,
        dedupeKey: `event_live:${eventId}`,
      });
    } catch {
      // optional
    }
  }

  private async invalidateCache() {
    await this.redis.incr('events:list:version');
  }
}
