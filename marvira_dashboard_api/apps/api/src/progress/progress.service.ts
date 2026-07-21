import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { isWithinRadius, buildPaginatedResponse, parsePagination } from '@marvira/shared-utils';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../common/redis/redis.service';
import { WebsocketGateway } from '../websocket/websocket.gateway';
import { QuestionType, Prisma } from '@prisma/client';
import { UnlockPlaceDto, AnswerPlaceDto } from '../places/dto/place.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { EventAccessService } from '../events/event-access.service';
import { AnticheatService } from '../anticheat/anticheat.service';

const COOLDOWN_SECONDS = 5;

@Injectable()
export class ProgressService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly websocket: WebsocketGateway,
    private readonly moduleRef: ModuleRef,
    private readonly eventAccess: EventAccessService,
    private readonly anticheat: AnticheatService,
  ) {}

  async unlockPlace(userId: string, placeId: string, dto: UnlockPlaceDto) {
    await this.checkRateLimit(userId, 'unlock');

    const place = await this.prisma.client.place.findUnique({
      where: { id: placeId },
      include: { event: { include: { places: { orderBy: { orderIndex: 'asc' } } } } },
    });
    if (!place) throw new NotFoundException('Place not found');

    await this.eventAccess.assertCanPlay(userId, place.eventId);

    const places = place.event.places;
    const placeIndex = places.findIndex((p) => p.id === placeId);
    if (placeIndex === -1) throw new NotFoundException('Place not found in event');

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

    if (!isWithinRadius(dto.latitude, dto.longitude, place.latitude, place.longitude, place.radiusMeters)) {
      throw new BadRequestException('You must be within the place radius to unlock');
    }

    const previousPlace = await this.getPreviousPlaceContext(userId, places, placeIndex);
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
    const existingCompletion = await this.prisma.client.userPlaceCompletion.findUnique({
      where: { userId_placeId: { userId, placeId } },
    });

    await this.prisma.client.userPlaceCompletion.upsert({
      where: { userId_placeId: { userId, placeId } },
      create: { userId, placeId, completed: false, unlockedAt: now },
      update: existingCompletion?.unlockedAt ? {} : { unlockedAt: now },
    });

    this.websocket.emitPlaceUnlocked(userId, placeId, place.eventId);

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
    if (!place || !place.question) throw new NotFoundException('Place or question not found');

    await this.eventAccess.assertCanPlay(userId, place.eventId);

    const progress = await this.prisma.client.userEventProgress.findUnique({
      where: { userId_eventId: { userId, eventId: place.eventId } },
    });
    if (!progress) throw new ForbiddenException('Place not unlocked');
    if (progress.completed) {
      throw new ForbiddenException('Event already completed');
    }

    const placeIndex = place.event.places.findIndex((p) => p.id === placeId);
    if (placeIndex > progress.currentPlaceIndex) {
      throw new ForbiddenException('Place not unlocked yet');
    }

    if (!isWithinRadius(dto.latitude, dto.longitude, place.latitude, place.longitude, place.radiusMeters)) {
      throw new BadRequestException('You must be within the place radius to submit an answer');
    }

    const existingCompletion = await this.prisma.client.userPlaceCompletion.findUnique({
      where: { userId_placeId: { userId, placeId } },
    });

    if (existingCompletion?.completed) {
      const isLastPlace = placeIndex === place.event.places.length - 1;
      return {
        correct: true,
        points: 0,
        totalScore: progress.score,
        explanation: place.question.explanation,
        nextPlaceId: isLastPlace ? null : (place.event.places[placeIndex + 1]?.id ?? null),
        eventCompleted: isLastPlace,
        answerDurationMs: existingCompletion.answerDurationMs,
        eventTotalDurationMs: isLastPlace ? progress.totalDurationMs : null,
        warnings: [],
        alreadyCompleted: true,
      };
    }

    const previousPlace = await this.getPreviousPlaceContext(userId, place.event.places, placeIndex);
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
      answerDurationMs = now.getTime() - existingCompletion.unlockedAt.getTime();
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

    if (correct) {
      const isLastPlace = placeIndex === place.event.places.length - 1;
      const rewardBonus = isLastPlace ? place.event.rewardPoints : 0;
      totalScore = progress.score + points + rewardBonus;
      const newIndex = isLastPlace ? placeIndex : placeIndex + 1;

      if (isLastPlace) {
        eventTotalDurationMs = now.getTime() - progress.startedAt.getTime();
      }

      await this.prisma.client.userEventProgress.update({
        where: { id: progress.id },
        data: {
          score: totalScore,
          currentPlaceIndex: newIndex,
          completed: isLastPlace,
          completedAt: isLastPlace ? now : null,
          totalDurationMs: isLastPlace ? eventTotalDurationMs : null,
        },
      });

      if (!isLastPlace) {
        nextPlaceId = place.event.places[placeIndex + 1]?.id ?? null;
      } else {
        eventCompleted = true;
        this.websocket.emitEventCompleted(userId, place.eventId, totalScore);
        await this.enqueueEventCompletedNotification(userId, place.event.title, totalScore);
      }

      this.websocket.emitProgressUpdated(userId, place.eventId, newIndex, totalScore);
    }

    await this.prisma.client.analyticsEvent.create({
      data: {
        userId,
        eventName: 'place_answered',
        payload: { placeId, correct, points, answerDurationMs, eventTotalDurationMs },
      },
    });

    return {
      correct,
      points: correct ? points + (eventCompleted ? place.event.rewardPoints : 0) : 0,
      totalScore,
      explanation: correct ? place.question.explanation : null,
      nextPlaceId,
      eventCompleted,
      answerDurationMs,
      eventTotalDurationMs,
      warnings,
    };
  }

  private async getPreviousPlaceContext(
    userId: string,
    places: { id: string; latitude: number; longitude: number; orderIndex: number }[],
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
    const normalized = submitted.trim().toLowerCase();
    const expected = question.answer.trim().toLowerCase();

    if (question.type === QuestionType.MULTIPLE_CHOICE) {
      const options = (question.options as string[] | null) ?? [];
      return options.some((o) => o.trim().toLowerCase() === normalized) && normalized === expected;
    }

    if (question.type === QuestionType.TRUE_FALSE) {
      return normalized === 'true' || normalized === 'false'
        ? normalized === expected
        : false;
    }

    return normalized === expected;
  }

  private async checkRateLimit(userId: string, action: string) {
    const key = `rate:${action}:${userId}`;
    const count = await this.redis.incr(key);
    if (count === 1) await this.redis.expire(key, COOLDOWN_SECONDS);
    if (count > 10) throw new HttpException('Too many requests, please slow down', HttpStatus.TOO_MANY_REQUESTS);
  }

  private async enqueueEventCompletedNotification(
    userId: string,
    eventTitle: string,
    score: number,
  ) {
    try {
      const notifications = this.moduleRef.get(NotificationsService, { strict: false });
      if (notifications) {
        await notifications.sendNotification(
          userId,
          `You completed "${eventTitle}" with ${score} points!`,
          'event_completed',
        );
      }
    } catch {
      // Notifications queue unavailable (e.g. REDIS_DISABLED dev mode)
    }
  }

  async getCompletedEvents(userId: string) {
    return this.prisma.client.userEventProgress.findMany({
      where: { userId, completed: true },
      include: { event: true },
      orderBy: { completedAt: 'desc' },
    });
  }

  async getEventLeaderboard(eventId: string, limit = 50) {
    const event = await this.prisma.client.event.findUnique({ where: { id: eventId } });
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
      _sum: { score: true },
      _count: { _all: true },
      _avg: { totalDurationMs: true },
    });

    const sorted = groups
      .sort((a, b) => {
        const scoreDiff = (b._sum.score ?? 0) - (a._sum.score ?? 0);
        if (scoreDiff !== 0) return scoreDiff;
        const countDiff = b._count._all - a._count._all;
        if (countDiff !== 0) return countDiff;
        const avgA = a._avg.totalDurationMs ?? Number.POSITIVE_INFINITY;
        const avgB = b._avg.totalDurationMs ?? Number.POSITIVE_INFINITY;
        return avgA - avgB;
      })
      .slice(0, take);

    const userIds = sorted.map((g) => g.userId);
    const users = await this.prisma.client.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true },
    });
    const userMap = new Map(users.map((u) => [u.id, u.name]));

    return {
      entries: sorted.map((group, index) => ({
        rank: index + 1,
        userId: group.userId,
        userName: userMap.get(group.userId) ?? 'Unknown',
        totalScore: group._sum.score ?? 0,
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

    const [rows, total] = await Promise.all([
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
    ]);

    const items = rows.map((row) => ({
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
    }));

    return {
      event: { id: event.id, title: event.title, city: event.city },
      participants: buildPaginatedResponse(items, total, page, pageSize),
    };
  }
}
