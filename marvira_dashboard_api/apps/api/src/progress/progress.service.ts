import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import {
  isWithinRadius,
  buildPaginatedResponse,
  parsePagination,
} from '@marvira/shared-utils';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../common/redis/redis.service';
import { QuestionType, Prisma } from '@prisma/client';
import { UnlockPlaceDto, AnswerPlaceDto } from '../places/dto/place.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { EventAccessService } from '../events/event-access.service';
import { AnticheatService } from '../anticheat/anticheat.service';
import { buildCompletionPayload } from '../events/gift-codes.util';
import { isAnswerCorrect as matchAnswer } from '../common/utils/answer-match.util';
import {
  computeGlobalScoreContribution,
  startOfUtcDay,
} from './global-score.util';

const COOLDOWN_SECONDS = 5;

type CompletionGiftFields = ReturnType<typeof buildCompletionPayload>;

@Injectable()
export class ProgressService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly moduleRef: ModuleRef,
    private readonly eventAccess: EventAccessService,
    private readonly anticheat: AnticheatService,
  ) {}

  async unlockPlace(userId: string, placeId: string, dto: UnlockPlaceDto) {
    await this.checkRateLimit(userId, 'unlock');

    const place = await this.prisma.client.place.findUnique({
      where: { id: placeId },
      include: {
        event: { include: { places: { orderBy: { orderIndex: 'asc' } } } },
      },
    });
    if (!place) throw new NotFoundException('Place not found');

    await this.eventAccess.assertCanPlay(userId, place.eventId);

    const places = place.event.places;
    const placeIndex = places.findIndex(p => p.id === placeId);
    if (placeIndex === -1)
      throw new NotFoundException('Place not found in event');

    let progress = await this.prisma.client.userEventProgress.findUnique({
      where: { userId_eventId: { userId, eventId: place.eventId } },
    });

    if (!progress) {
      if (placeIndex !== 0) {
        throw new ForbiddenException('Complete previous places first');
      }
      progress = await this.prisma.client.userEventProgress.create({
        data: { userId, eventId: place.eventId, currentPlaceIndex: 0 },
      });
    } else if (progress.completed) {
      throw new ForbiddenException('Event already completed');
    } else if (placeIndex > progress.currentPlaceIndex) {
      throw new ForbiddenException('Complete previous places first');
    }

    if (
      !isWithinRadius(
        dto.latitude,
        dto.longitude,
        place.latitude,
        place.longitude,
        place.radiusMeters,
      )
    ) {
      throw new BadRequestException(
        'You must be within the place radius to unlock',
      );
    }

    const previousPlace = await this.getPreviousPlaceContext(
      userId,
      places,
      placeIndex,
    );
    const warnings = await this.anticheat.evaluateAndRecord(
      userId,
      {
        latitude: dto.latitude,
        longitude: dto.longitude,
        accuracy: dto.accuracy,
        timestamp: dto.timestamp,
      },
      {
        placeId,
        eventId: place.eventId,
        placeIndex,
        previousPlace,
      },
    );

    const now = new Date();
    const existingCompletion =
      await this.prisma.client.userPlaceCompletion.findUnique({
        where: { userId_placeId: { userId, placeId } },
      });

    await this.prisma.client.userPlaceCompletion.upsert({
      where: { userId_placeId: { userId, placeId } },
      create: { userId, placeId, completed: false, unlockedAt: now },
      update: existingCompletion?.unlockedAt ? {} : { unlockedAt: now },
    });

    return {
      unlocked: true,
      placeId,
      eventId: place.eventId,
      currentPlaceIndex: progress.currentPlaceIndex,
      warnings,
    };
  }

  async submitAnswer(userId: string, placeId: string, dto: AnswerPlaceDto) {
    await this.checkRateLimit(userId, 'answer');

    const place = await this.prisma.client.place.findUnique({
      where: { id: placeId },
      include: {
        question: true,
        event: { include: { places: { orderBy: { orderIndex: 'asc' } } } },
      },
    });
    if (!place || !place.question)
      throw new NotFoundException('Place or question not found');

    await this.eventAccess.assertCanPlay(userId, place.eventId);

    const progress = await this.prisma.client.userEventProgress.findUnique({
      where: { userId_eventId: { userId, eventId: place.eventId } },
    });
    if (!progress) throw new ForbiddenException('Place not unlocked');

    const placeIndex = place.event.places.findIndex(p => p.id === placeId);
    const isLastPlace = placeIndex === place.event.places.length - 1;

    // Idempotent: already finished → return stored completion snapshot
    if (progress.completed) {
      const giftFields = await this.completionFieldsFromProgress(
        progress,
        place.eventId,
      );
      return {
        correct: true,
        points: 0,
        totalScore: progress.score,
        explanation: place.question.explanation,
        nextPlaceId: null,
        eventCompleted: true,
        answerDurationMs: null,
        eventTotalDurationMs: progress.totalDurationMs,
        warnings: [],
        alreadyCompleted: true,
        ...giftFields,
      };
    }

    if (placeIndex > progress.currentPlaceIndex) {
      throw new ForbiddenException('Place not unlocked yet');
    }

    const existingCompletion =
      await this.prisma.client.userPlaceCompletion.findUnique({
        where: { userId_placeId: { userId, placeId } },
      });

    // Place already answered correctly
    if (existingCompletion?.completed) {
      // Recover: last place saved but event/gift assign never finished (crash between steps)
      if (isLastPlace) {
        const now = new Date();
        const eventTotalDurationMs =
          now.getTime() - progress.startedAt.getTime();
        const totalScore =
          progress.score + place.question.points + place.event.rewardPoints;
        const completed = await this.completeEventWithGiftAssign({
          progressId: progress.id,
          userId,
          eventId: place.eventId,
          totalScore,
          newIndex: placeIndex,
          now,
          eventTotalDurationMs,
          placeCount: place.event.places.length,
          rewardPoints: place.event.rewardPoints,
          eventCreatedBy: place.event.createdBy,
        });
        const giftFields = completed.giftFields;
        await this.enqueueEventCompletedNotification(
          userId,
          place.eventId,
          place.event.title,
          totalScore,
          progress.id,
        );
        return {
          correct: true,
          points: 0,
          totalScore,
          explanation: place.question.explanation,
          nextPlaceId: null,
          eventCompleted: true,
          answerDurationMs: existingCompletion.answerDurationMs,
          eventTotalDurationMs,
          warnings: [],
          alreadyCompleted: true,
          ...giftFields,
        };
      }

      return {
        correct: true,
        points: 0,
        totalScore: progress.score,
        explanation: place.question.explanation,
        nextPlaceId: place.event.places[placeIndex + 1]?.id ?? null,
        eventCompleted: false,
        answerDurationMs: existingCompletion.answerDurationMs,
        eventTotalDurationMs: null,
        warnings: [],
        alreadyCompleted: true,
      };
    }

    if (
      !isWithinRadius(
        dto.latitude,
        dto.longitude,
        place.latitude,
        place.longitude,
        place.radiusMeters,
      )
    ) {
      throw new BadRequestException(
        'You must be within the place radius to submit an answer',
      );
    }

    const previousPlace = await this.getPreviousPlaceContext(
      userId,
      place.event.places,
      placeIndex,
    );
    const warnings = await this.anticheat.evaluateAndRecord(
      userId,
      {
        latitude: dto.latitude,
        longitude: dto.longitude,
        accuracy: dto.accuracy,
        timestamp: dto.timestamp,
      },
      {
        placeId,
        eventId: place.eventId,
        placeIndex,
        previousPlace,
      },
    );

    const correct = this.isAnswerCorrect(place.question, dto.answer);
    const points = correct ? place.question.points : 0;
    const now = new Date();

    let answerDurationMs: number | null = null;
    if (correct && existingCompletion?.unlockedAt) {
      answerDurationMs =
        now.getTime() - existingCompletion.unlockedAt.getTime();
    }

    await this.prisma.client.userPlaceCompletion.upsert({
      where: { userId_placeId: { userId, placeId } },
      create: {
        userId,
        placeId,
        completed: correct,
        answer: dto.answer,
        completedAt: correct ? now : null,
        answerDurationMs: correct ? answerDurationMs : null,
      },
      update: {
        completed: correct,
        answer: dto.answer,
        completedAt: correct ? now : null,
        answerDurationMs: correct ? answerDurationMs : undefined,
      },
    });

    let nextPlaceId: string | null = null;
    let eventCompleted = false;
    let eventTotalDurationMs: number | null = null;
    let totalScore = progress.score;
    let giftFields: CompletionGiftFields | Record<string, never> = {};

    if (correct) {
      const rewardBonus = isLastPlace ? place.event.rewardPoints : 0;
      totalScore = progress.score + points + rewardBonus;
      const newIndex = isLastPlace ? placeIndex : placeIndex + 1;

      if (!isLastPlace) {
        await this.prisma.client.userEventProgress.update({
          where: { id: progress.id },
          data: {
            score: totalScore,
            currentPlaceIndex: newIndex,
          },
        });
        nextPlaceId = place.event.places[placeIndex + 1]?.id ?? null;
      } else {
        eventTotalDurationMs = now.getTime() - progress.startedAt.getTime();
        const completed = await this.completeEventWithGiftAssign({
          progressId: progress.id,
          userId,
          eventId: place.eventId,
          totalScore,
          newIndex,
          now,
          eventTotalDurationMs,
          placeCount: place.event.places.length,
          rewardPoints: place.event.rewardPoints,
          eventCreatedBy: place.event.createdBy,
        });
        eventCompleted = true;
        giftFields = completed.giftFields;
        await this.enqueueEventCompletedNotification(
          userId,
          place.eventId,
          place.event.title,
          totalScore,
          progress.id,
        );
      }
    }

    await this.prisma.client.analyticsEvent.create({
      data: {
        userId,
        eventName: 'place_answered',
        payload: {
          placeId,
          correct,
          points,
          answerDurationMs,
          eventTotalDurationMs,
        },
      },
    });

    return {
      correct,
      points: correct
        ? points + (eventCompleted ? place.event.rewardPoints : 0)
        : 0,
      totalScore,
      explanation: correct ? place.question.explanation : null,
      nextPlaceId,
      eventCompleted,
      answerDurationMs,
      eventTotalDurationMs,
      warnings,
      ...giftFields,
    };
  }

  /**
   * Serialize gift assign per event via row lock so concurrent finishers
   * never share the same rank/code.
   */
  private async completeEventWithGiftAssign(params: {
    progressId: string;
    userId: string;
    eventId: string;
    totalScore: number;
    newIndex: number;
    now: Date;
    eventTotalDurationMs: number;
    placeCount: number;
    rewardPoints: number;
    eventCreatedBy: string;
  }): Promise<{ giftFields: CompletionGiftFields }> {
    return this.prisma.client.$transaction(async tx => {
      await tx.$queryRaw`SELECT id FROM events WHERE id = ${params.eventId} FOR UPDATE`;

      const current = await tx.userEventProgress.findUnique({
        where: { id: params.progressId },
      });
      if (!current) throw new NotFoundException('Progress not found');

      if (current.completed) {
        const event = await tx.event.findUnique({
          where: { id: params.eventId },
          select: {
            completionMessage: true,
            giftTeaser: true,
            giftCodes: true,
          },
        });
        return {
          giftFields: buildCompletionPayload({
            finishRank: current.finishRank,
            giftCodeAwarded: current.giftCodeAwarded,
            completionMessage: event?.completionMessage ?? null,
            giftTeaser: event?.giftTeaser ?? null,
            giftCount: event?.giftCodes?.length ?? 0,
          }),
        };
      }

      const event = await tx.event.findUnique({
        where: { id: params.eventId },
        select: {
          completionMessage: true,
          giftTeaser: true,
          giftCodes: true,
        },
      });
      if (!event) throw new NotFoundException('Event not found');

      const giftCodes = event.giftCodes ?? [];
      const dayStart = startOfUtcDay(params.now);
      const todayAgg = await tx.userEventProgress.aggregate({
        where: {
          userId: params.userId,
          completed: true,
          completedAt: { gte: dayStart },
        },
        _sum: { globalScore: true },
      });
      const questionPointsEarned = Math.max(
        0,
        params.totalScore - params.rewardPoints,
      );
      const globalScore = computeGlobalScoreContribution({
        isEventCreator: params.userId === params.eventCreatedBy,
        placeCount: params.placeCount,
        questionPointsEarned,
        globalPointsEarnedToday: todayAgg._sum.globalScore ?? 0,
      });

      await tx.userEventProgress.update({
        where: { id: params.progressId },
        data: {
          score: params.totalScore,
          globalScore,
          currentPlaceIndex: params.newIndex,
          completed: true,
          completedAt: params.now,
          totalDurationMs: params.eventTotalDurationMs,
        },
      });

      const finishers = await tx.userEventProgress.findMany({
        where: { eventId: params.eventId, completed: true },
        select: { userId: true, completedAt: true, startedAt: true },
        orderBy: [
          { completedAt: 'asc' },
          { startedAt: 'asc' },
          { userId: 'asc' },
        ],
      });

      const finishRank =
        finishers.findIndex(f => f.userId === params.userId) + 1;
      const giftCodeAwarded =
        finishRank > 0 && finishRank <= giftCodes.length
          ? giftCodes[finishRank - 1]
          : null;

      await tx.userEventProgress.update({
        where: { id: params.progressId },
        data: {
          finishRank,
          giftCodeAwarded,
        },
      });

      return {
        giftFields: buildCompletionPayload({
          finishRank,
          giftCodeAwarded,
          completionMessage: event.completionMessage,
          giftTeaser: event.giftTeaser,
          giftCount: giftCodes.length,
        }),
      };
    });
  }

  private async completionFieldsFromProgress(
    progress: {
      finishRank: number | null;
      giftCodeAwarded: string | null;
    },
    eventId: string,
  ): Promise<CompletionGiftFields> {
    const event = await this.prisma.client.event.findUnique({
      where: { id: eventId },
      select: {
        completionMessage: true,
        giftTeaser: true,
        giftCodes: true,
      },
    });
    return buildCompletionPayload({
      finishRank: progress.finishRank,
      giftCodeAwarded: progress.giftCodeAwarded,
      completionMessage: event?.completionMessage ?? null,
      giftTeaser: event?.giftTeaser ?? null,
      giftCount: event?.giftCodes?.length ?? 0,
    });
  }

  async getEventCompletion(userId: string, eventId: string) {
    const progress = await this.prisma.client.userEventProgress.findUnique({
      where: { userId_eventId: { userId, eventId } },
    });
    if (!progress || !progress.completed) {
      throw new ForbiddenException(
        'Complete this event to view completion details',
      );
    }

    const giftFields = await this.completionFieldsFromProgress(
      progress,
      eventId,
    );
    return {
      eventCompleted: true as const,
      ...giftFields,
      score: progress.score,
      totalDurationMs: progress.totalDurationMs,
    };
  }

  async getEventFinishers(eventId: string) {
    const event = await this.prisma.client.event.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        title: true,
        city: true,
        giftCodes: true,
      },
    });
    if (!event) throw new NotFoundException('Event not found');

    const giftCount = event.giftCodes?.length ?? 0;

    const rows = await this.prisma.client.userEventProgress.findMany({
      where: { eventId, completed: true },
      include: { user: { select: { id: true, name: true } } },
      orderBy: [
        { finishRank: 'asc' },
        { completedAt: 'asc' },
        { startedAt: 'asc' },
        { userId: 'asc' },
      ],
    });

    const giftAssignedCount = rows.filter(
      r => r.giftCodeAwarded != null,
    ).length;

    return {
      event: { id: event.id, title: event.title, city: event.city },
      giftCount,
      giftAssignedCount,
      finishers: rows.map(row => ({
        userId: row.userId,
        userName: row.user.name,
        completedAt: row.completedAt!.toISOString(),
        totalDurationMs: row.totalDurationMs,
        score: row.score,
        finishRank: row.finishRank,
        giftCodeAwarded: row.giftCodeAwarded,
      })),
    };
  }

  private async getPreviousPlaceContext(
    userId: string,
    places: {
      id: string;
      latitude: number;
      longitude: number;
      orderIndex: number;
    }[],
    placeIndex: number,
  ) {
    if (placeIndex <= 0) return null;

    const previous = places[placeIndex - 1];
    if (!previous) return null;

    const completion = await this.prisma.client.userPlaceCompletion.findUnique({
      where: { userId_placeId: { userId, placeId: previous.id } },
      select: { unlockedAt: true },
    });

    if (!completion?.unlockedAt) return null;

    return {
      id: previous.id,
      latitude: previous.latitude,
      longitude: previous.longitude,
      unlockedAt: completion.unlockedAt,
    };
  }

  private isAnswerCorrect(
    question: {
      type: QuestionType;
      answer: string;
      options: unknown;
    },
    submitted: string,
  ): boolean {
    return matchAnswer(question, submitted);
  }

  private async checkRateLimit(userId: string, action: string) {
    const key = `rate:${action}:${userId}`;
    const count = await this.redis.incr(key);
    if (count === 1) await this.redis.expire(key, COOLDOWN_SECONDS);
    if (count > 10)
      throw new HttpException(
        'Too many requests, please slow down',
        HttpStatus.TOO_MANY_REQUESTS,
      );
  }

  private async enqueueEventCompletedNotification(
    userId: string,
    eventId: string,
    eventTitle: string,
    score: number,
    progressId: string,
  ) {
    try {
      const notifications = this.moduleRef.get(NotificationsService, {
        strict: false,
      });
      if (notifications) {
        await notifications.createAndEnqueue({
          userId,
          type: 'EVENT_COMPLETED',
          copyParams: { eventTitle, score },
          data: { eventId },
          relatedEntityType: 'event',
          relatedEntityId: eventId,
          dedupeKey: `event_completed:${progressId}`,
        });
      }
    } catch {
      // Notifications queue unavailable (e.g. REDIS_DISABLED dev mode)
    }
  }

  async getCompletedEvents(userId: string) {
    const rows = await this.prisma.client.userEventProgress.findMany({
      where: { userId, completed: true },
      include: {
        event: {
          include: {
            creator: { select: { name: true, email: true } },
            _count: { select: { places: true } },
          },
        },
      },
      orderBy: { completedAt: 'desc' },
    });

    return rows.map(row => {
      const {
        creator,
        joinPasswordHash,
        giftCodes,
        completionMessage: _completionMessage,
        ...event
      } = row.event;
      const codes = giftCodes ?? [];
      const creatorEmail = creator?.email?.toLowerCase() ?? '';
      const creatorDomain = creatorEmail.includes('@')
        ? creatorEmail.split('@')[1] ?? ''
        : creatorEmail;
      const creatorName =
        creatorDomain.includes('marvira') ? 'Marvira' : creator?.name?.trim() || 'Marvira';
      return {
        ...row,
        event: {
          ...event,
          creatorName,
          isPasswordProtected: joinPasswordHash != null,
          hasGift: codes.length > 0,
          giftCount: codes.length,
          giftTeaser: event.giftTeaser ?? null,
        },
      };
    });
  }

  async getEventLeaderboard(eventId: string, limit = 50) {
    const event = await this.prisma.client.event.findUnique({
      where: { id: eventId },
    });
    if (!event) throw new NotFoundException('Event not found');

    const take = Math.min(Math.max(limit, 1), 100);
    const entries = await this.prisma.client.userEventProgress.findMany({
      where: {
        eventId,
        completed: true,
        totalDurationMs: { not: null },
        completedAt: { not: null },
      },
      include: { user: { select: { id: true, name: true } } },
      orderBy: [{ score: 'desc' }, { totalDurationMs: 'asc' }],
      take,
    });

    return {
      event: { id: event.id, title: event.title, city: event.city },
      entries: entries.map((entry, index) => ({
        rank: index + 1,
        userId: entry.userId,
        userName: entry.user.name,
        score: entry.score,
        totalDurationMs: entry.totalDurationMs!,
        completedAt: entry.completedAt!.toISOString(),
      })),
    };
  }

  async getGlobalLeaderboard(limit = 50) {
    const take = Math.min(Math.max(limit, 1), 100);

    const groups = await this.prisma.client.userEventProgress.groupBy({
      by: ['userId'],
      where: { completed: true },
      _sum: { globalScore: true },
      _count: { _all: true },
      _avg: { totalDurationMs: true },
    });

    const sorted = groups
      .sort((a, b) => {
        const scoreDiff = (b._sum.globalScore ?? 0) - (a._sum.globalScore ?? 0);
        if (scoreDiff !== 0) return scoreDiff;
        const countDiff = b._count._all - a._count._all;
        if (countDiff !== 0) return countDiff;
        const avgA = a._avg.totalDurationMs ?? Number.POSITIVE_INFINITY;
        const avgB = b._avg.totalDurationMs ?? Number.POSITIVE_INFINITY;
        return avgA - avgB;
      })
      .slice(0, take);

    const userIds = sorted.map(g => g.userId);
    const users = await this.prisma.client.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true },
    });
    const userMap = new Map(users.map(u => [u.id, u.name]));

    return {
      entries: sorted.map((group, index) => ({
        rank: index + 1,
        userId: group.userId,
        userName: userMap.get(group.userId) ?? 'Unknown',
        totalScore: group._sum.globalScore ?? 0,
        eventsCompleted: group._count._all,
        avgDurationMs:
          group._avg.totalDurationMs != null
            ? Math.round(group._avg.totalDurationMs)
            : null,
      })),
    };
  }

  async getEventParticipants(
    eventId: string,
    page = 1,
    pageSize = 20,
    search?: string,
    sortBy: 'fastest' | 'slowest' | 'score' | 'started' | 'name' = 'started',
  ) {
    const event = await this.prisma.client.event.findUnique({
      where: { id: eventId },
      include: { _count: { select: { places: true } } },
    });
    if (!event) throw new NotFoundException('Event not found');

    const { skip, take } = parsePagination({ page, pageSize });
    const totalPlaces = event._count.places;
    const giftCount = event.giftCodes?.length ?? 0;

    const userFilter = search
      ? {
          user: {
            OR: [
              { name: { contains: search, mode: 'insensitive' as const } },
              { email: { contains: search, mode: 'insensitive' as const } },
            ],
          },
        }
      : {};

    const where = { eventId, ...userFilter };

    let orderBy: Prisma.UserEventProgressOrderByWithRelationInput[];
    switch (sortBy) {
      case 'fastest':
        orderBy = [{ completed: 'desc' }, { totalDurationMs: 'asc' }];
        break;
      case 'slowest':
        orderBy = [{ completed: 'desc' }, { totalDurationMs: 'desc' }];
        break;
      case 'score':
        orderBy = [{ score: 'desc' }, { totalDurationMs: 'asc' }];
        break;
      case 'name':
        orderBy = [{ user: { name: 'asc' } }];
        break;
      case 'started':
      default:
        orderBy = [{ startedAt: 'desc' }];
        break;
    }

    const [rows, total, giftAssignedCount] = await Promise.all([
      this.prisma.client.userEventProgress.findMany({
        where,
        skip,
        take,
        orderBy,
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      }),
      this.prisma.client.userEventProgress.count({ where }),
      this.prisma.client.userEventProgress.count({
        where: { eventId, giftCodeAwarded: { not: null } },
      }),
    ]);

    const items = rows.map(row => ({
      userId: row.userId,
      userName: row.user.name,
      userEmail: row.user.email,
      score: row.score,
      completed: row.completed,
      currentPlaceIndex: row.currentPlaceIndex,
      placesCompleted: row.completed ? totalPlaces : row.currentPlaceIndex,
      totalPlaces,
      startedAt: row.startedAt.toISOString(),
      completedAt: row.completedAt?.toISOString() ?? null,
      totalDurationMs: row.totalDurationMs,
      finishRank: row.finishRank,
      giftCodeAwarded: row.giftCodeAwarded,
    }));

    return {
      event: {
        id: event.id,
        title: event.title,
        city: event.city,
        giftCount,
        giftAssignedCount,
      },
      participants: buildPaginatedResponse(items, total, page, pageSize),
    };
  }
}
