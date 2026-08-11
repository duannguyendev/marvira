import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from '../auth/auth.service';
import { RedisService } from '../common/redis/redis.service';
import { UserModerationService } from '../anticheat/user-moderation.service';

const JOIN_RATE_LIMIT_MAX = 5;
const JOIN_RATE_LIMIT_TTL_SECONDS = 900;

type EventAccessFields = {
  id: string;
  createdBy: string;
  joinPasswordHash: string | null;
};

@Injectable()
export class EventAccessService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auth: AuthService,
    private readonly redis: RedisService,
    private readonly userModeration: UserModerationService,
    private readonly moduleRef: ModuleRef,
  ) {}

  isPasswordProtected(event: { joinPasswordHash: string | null }): boolean {
    return event.joinPasswordHash != null;
  }

  async hasAccess(
    userId: string | undefined,
    event: EventAccessFields,
  ): Promise<boolean> {
    if (!this.isPasswordProtected(event)) {
      return true;
    }
    if (!userId) {
      return false;
    }
    if (event.createdBy === userId) {
      return true;
    }

    const [access, progress] = await Promise.all([
      this.prisma.client.userEventAccess.findUnique({
        where: { userId_eventId: { userId, eventId: event.id } },
      }),
      this.prisma.client.userEventProgress.findUnique({
        where: { userId_eventId: { userId, eventId: event.id } },
      }),
    ]);

    return !!access || !!progress;
  }

  async assertCanPlay(userId: string, eventId: string): Promise<void> {
    await this.userModeration.assertCanPlay(userId);

    let event = await this.prisma.client.event.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        createdBy: true,
        joinPasswordHash: true,
        isActive: true,
        scheduledPublishAt: true,
        endedAt: true,
      },
    });
    if (!event) {
      throw new NotFoundException('Event not found');
    }

    if (
      !event.isActive &&
      !event.endedAt &&
      event.scheduledPublishAt &&
      event.scheduledPublishAt.getTime() <= Date.now()
    ) {
      await this.ensureLiveIfDue(eventId);
      event = await this.reloadAccessEvent(eventId);
      if (!event) throw new NotFoundException('Event not found');
    }

    await this.ensureEndedIfDue(eventId);
    event = await this.reloadAccessEvent(eventId);
    if (!event) throw new NotFoundException('Event not found');

    if ((!event.isActive || event.endedAt) && event.createdBy !== userId) {
      const progress = await this.prisma.client.userEventProgress.findUnique({
        where: { userId_eventId: { userId, eventId } },
        select: { id: true },
      });
      if (!progress) {
        throw new NotFoundException('Event not found');
      }
    }

    if (await this.hasAccess(userId, event)) {
      return;
    }
    throw new ForbiddenException('Password required to play this event');
  }

  private async reloadAccessEvent(eventId: string) {
    return this.prisma.client.event.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        createdBy: true,
        joinPasswordHash: true,
        isActive: true,
        scheduledPublishAt: true,
        endedAt: true,
      },
    });
  }

  private async ensureLiveIfDue(eventId: string): Promise<void> {
    try {
      const { ScheduledPublishService } = await import(
        './scheduled-publish.service'
      );
      const service = this.moduleRef.get(ScheduledPublishService, {
        strict: false,
      });
      if (service) {
        await service.ensureLiveIfDue(eventId);
      }
    } catch {
      // Optional when circular/missing
    }
  }

  private async ensureEndedIfDue(eventId: string): Promise<void> {
    try {
      const { EventEndService } = await import('./event-end.service');
      const service = this.moduleRef.get(EventEndService, {
        strict: false,
      });
      if (service) {
        await service.ensureEndedIfDue(eventId);
      }
    } catch {
      // Optional when circular/missing
    }
  }

  async joinEvent(userId: string, eventId: string, password: string) {
    await this.userModeration.assertCanPlay(userId);
    await this.ensureLiveIfDue(eventId);
    await this.ensureEndedIfDue(eventId);

    const event = await this.prisma.client.event.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        createdBy: true,
        joinPasswordHash: true,
        isActive: true,
        endedAt: true,
      },
    });
    if (!event) {
      throw new NotFoundException('Event not found');
    }
    if (!event.isActive || event.endedAt) {
      throw new NotFoundException('Event not found');
    }
    if (!this.isPasswordProtected(event)) {
      return { joined: true, hasAccess: true };
    }
    if (await this.hasAccess(userId, event)) {
      return { joined: true, hasAccess: true };
    }

    const rateKey = `rate:join:${userId}:${eventId}`;
    const attempts = await this.redis.incr(rateKey);
    if (attempts === 1) {
      await this.redis.expire(rateKey, JOIN_RATE_LIMIT_TTL_SECONDS);
    }
    if (attempts > JOIN_RATE_LIMIT_MAX) {
      throw new HttpException(
        'Too many attempts',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const valid = await this.auth.comparePassword(
      password,
      event.joinPasswordHash!,
    );
    if (!valid) {
      throw new ForbiddenException('Incorrect password');
    }

    await this.redis.del(rateKey);

    await this.prisma.client.userEventAccess.upsert({
      where: { userId_eventId: { userId, eventId } },
      create: { userId, eventId },
      update: {},
    });

    return { joined: true, hasAccess: true };
  }

  async invalidateAccessGrants(eventId: string): Promise<void> {
    await this.prisma.client.userEventAccess.deleteMany({ where: { eventId } });
  }

  toPublicFields<
    T extends {
      joinPasswordHash?: string | null;
      giftCodes?: string[] | null;
      completionMessage?: string | null;
      giftTeaser?: string | null;
      creator?: { name: string } | null;
      creatorName?: string | null;
    },
  >(
    event: T,
    options?: { hasAccess?: boolean; includeOwnerGiftFields?: boolean },
  ): Omit<
    T,
    | 'joinPasswordHash'
    | 'giftCodes'
    | 'completionMessage'
    | 'creator'
    | 'creatorName'
  > & {
    isPasswordProtected: boolean;
    hasAccess?: boolean;
    hasGift: boolean;
    giftCount: number;
    giftTeaser: string | null;
    giftCodes?: string[];
    completionMessage?: string | null;
    creatorName: string;
  } {
    const {
      joinPasswordHash,
      giftCodes,
      completionMessage,
      creator,
      creatorName,
      ...rest
    } = event;
    const codes = giftCodes ?? [];
    const hasAccess = options?.hasAccess;
    const includeOwner = options?.includeOwnerGiftFields === true;
    const resolvedName =
      (typeof creatorName === 'string' && creatorName.trim()) ||
      (typeof creator?.name === 'string' && creator.name.trim()) ||
      'Marvira';

    return {
      ...rest,
      creatorName: resolvedName,
      isPasswordProtected: joinPasswordHash != null,
      hasGift: codes.length > 0,
      giftCount: codes.length,
      giftTeaser: rest.giftTeaser ?? null,
      ...(hasAccess !== undefined ? { hasAccess } : {}),
      ...(includeOwner
        ? { giftCodes: codes, completionMessage: completionMessage ?? null }
        : {}),
    };
  }

  validateJoinPassword(password: string): void {
    if (password.length < 4) {
      throw new BadRequestException('Password must be at least 4 characters');
    }
    if (password.length > 64) {
      throw new BadRequestException('Password must be at most 64 characters');
    }
  }
}
