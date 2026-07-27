import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../common/redis/redis.service';
import { EventAccessService } from '../events/event-access.service';
import { NotificationsService } from '../notifications/notifications.service';

const REPORT_RATE_LIMIT = 10;
const REPORT_RATE_WINDOW_SEC = 3600;

@Injectable()
export class PlaceAnswerReportService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly eventAccess: EventAccessService,
    private readonly notifications: NotificationsService,
  ) {}

  async reportWrongAnswer(userId: string, placeId: string) {
    await this.checkRateLimit(userId);

    const place = await this.prisma.client.place.findUnique({
      where: { id: placeId },
      include: {
        event: { select: { id: true, title: true, createdBy: true, isActive: true } },
      },
    });
    if (!place) throw new NotFoundException('Place not found');

    await this.eventAccess.assertCanPlay(userId, place.eventId);

    const completion = await this.prisma.client.userPlaceCompletion.findUnique({
      where: { userId_placeId: { userId, placeId } },
    });

    if (!completion?.unlockedAt) {
      throw new ForbiddenException(
        'Unlock this place and try an answer before reporting',
      );
    }
    if (completion.completed) {
      throw new BadRequestException('You already completed this place');
    }
    if (!completion.answer?.trim()) {
      throw new ForbiddenException(
        'Submit at least one answer before reporting a problem',
      );
    }

    const existing = await this.prisma.client.placeAnswerReport.findUnique({
      where: { userId_placeId: { userId, placeId } },
    });

    if (existing) {
      await this.prisma.client.placeAnswerReport.update({
        where: { id: existing.id },
        data: { lastReportedAt: new Date() },
      });
      return {
        reported: true,
        alreadyReported: true,
        message: 'You already reported this stop. The organizer has been notified.',
      };
    }

    await this.prisma.client.placeAnswerReport.create({
      data: {
        userId,
        placeId,
        eventId: place.eventId,
      },
    });

    await this.notifyStakeholders(place);

    return {
      reported: true,
      alreadyReported: false,
      message:
        'Thanks — we notified the organizer. You can keep trying; they may update the answer.',
    };
  }

  async getReportSummaryForEvent(eventId: string, userId: string) {
    const event = await this.prisma.client.event.findUnique({
      where: { id: eventId },
      select: { createdBy: true },
    });
    if (!event) throw new NotFoundException('Event not found');

    const user = await this.prisma.client.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    const isStaff = user?.role === 'ADMIN' || user?.role === 'STAFF';
    if (event.createdBy !== userId && !isStaff) {
      throw new ForbiddenException('Not allowed');
    }

    const reports = await this.prisma.client.placeAnswerReport.groupBy({
      by: ['placeId'],
      where: { eventId },
      _count: { _all: true },
      _max: { lastReportedAt: true },
    });

    const places = await this.prisma.client.place.findMany({
      where: { eventId },
      select: { id: true, title: true, orderIndex: true },
      orderBy: { orderIndex: 'asc' },
    });

    return places.map(place => {
      const group = reports.find(r => r.placeId === place.id);
      return {
        placeId: place.id,
        placeTitle: place.title,
        orderIndex: place.orderIndex,
        reporterCount: group?._count._all ?? 0,
        lastReportedAt: group?._max.lastReportedAt ?? null,
      };
    });
  }

  async listAdminQueue(limit = 50) {
    const groups = await this.prisma.client.placeAnswerReport.groupBy({
      by: ['eventId', 'placeId'],
      _count: { _all: true },
      _max: { lastReportedAt: true },
      orderBy: { _max: { lastReportedAt: 'desc' } },
      take: Math.min(Math.max(limit, 1), 200),
    });

    if (groups.length === 0) return [];

    const eventIds = [...new Set(groups.map(g => g.eventId))];
    const placeIds = [...new Set(groups.map(g => g.placeId))];

    const [events, places] = await Promise.all([
      this.prisma.client.event.findMany({
        where: { id: { in: eventIds } },
        select: { id: true, title: true, city: true, isActive: true },
      }),
      this.prisma.client.place.findMany({
        where: { id: { in: placeIds } },
        select: { id: true, title: true, orderIndex: true, eventId: true },
      }),
    ]);

    const eventMap = new Map(events.map(e => [e.id, e]));
    const placeMap = new Map(places.map(p => [p.id, p]));

    return groups.map(g => {
      const event = eventMap.get(g.eventId);
      const place = placeMap.get(g.placeId);
      return {
        eventId: g.eventId,
        eventTitle: event?.title ?? 'Unknown event',
        eventCity: event?.city ?? null,
        eventIsActive: event?.isActive ?? false,
        placeId: g.placeId,
        placeTitle: place?.title ?? 'Unknown place',
        placeOrderIndex: place?.orderIndex ?? 0,
        reporterCount: g._count._all,
        lastReportedAt: g._max.lastReportedAt,
      };
    });
  }

  private async notifyStakeholders(
    place: {
      id: string;
      title: string;
      eventId: string;
      event: { title: string; createdBy: string };
    },
  ) {
    const message = `Wrong answer report at "${place.title}" in ${place.event.title}`;
    await this.notifications.sendNotification(
      place.event.createdBy,
      message,
      'wrong_answer_report',
    );

    const admins = await this.prisma.client.user.findMany({
      where: { role: 'ADMIN', isActive: true },
      select: { id: true },
    });
    for (const admin of admins) {
      if (admin.id !== place.event.createdBy) {
        await this.notifications.sendNotification(
          admin.id,
          message,
          'wrong_answer_report',
        );
      }
    }
  }

  private async checkRateLimit(userId: string) {
    const key = `rate:answer-report:${userId}`;
    const count = await this.redis.incr(key);
    if (count === 1) {
      await this.redis.expire(key, REPORT_RATE_WINDOW_SEC);
    }
    if (count > REPORT_RATE_LIMIT) {
      throw new HttpException(
        'Too many reports. Please try again later.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }
}
