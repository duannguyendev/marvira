import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../common/redis/redis.service';

@Injectable()
export class AnalyticsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async getOverview() {
    const cacheKey = 'analytics:overview';
    const cached = await this.redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [totalUsers, activeUsers, totalEvents, completedEvents] = await Promise.all([
      this.prisma.client.user.count(),
      this.prisma.client.userEventProgress.count({
        where: { startedAt: { gte: thirtyDaysAgo } },
      }),
      this.prisma.client.event.count({ where: { isActive: true } }),
      this.prisma.client.userEventProgress.count({ where: { completed: true } }),
    ]);

    const totalProgress = await this.prisma.client.userEventProgress.count();
    const completionRate = totalProgress > 0 ? (completedEvents / totalProgress) * 100 : 0;

    const result = {
      totalUsers,
      activeUsers,
      totalEvents,
      completedEvents,
      completionRate: Math.round(completionRate * 10) / 10,
    };

    await this.redis.set(cacheKey, JSON.stringify(result), 120);
    return result;
  }

  async getEventAnalytics() {
    const events = await this.prisma.client.event.findMany({
      include: {
        progress: true,
      },
    });

    return events.map((event) => {
      const participants = event.progress.length;
      const completions = event.progress.filter((p) => p.completed).length;
      const avgScore =
        participants > 0
          ? event.progress.reduce((sum, p) => sum + p.score, 0) / participants
          : 0;

      return {
        eventId: event.id,
        eventTitle: event.title,
        participants,
        completions,
        completionRate: participants > 0 ? (completions / participants) * 100 : 0,
        averageScore: Math.round(avgScore * 10) / 10,
      };
    });
  }

  async getEngagementChart(days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const events = await this.prisma.client.analyticsEvent.groupBy({
      by: ['eventName'],
      where: { createdAt: { gte: startDate } },
      _count: { id: true },
    });

    return events.map((e) => ({
      name: e.eventName,
      count: e._count.id,
    }));
  }

  async getActivityByDay(days = 14) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const events = await this.prisma.client.analyticsEvent.findMany({
      where: { createdAt: { gte: startDate } },
      select: { createdAt: true },
    });

    const byDay = new Map<string, number>();
    for (const event of events) {
      const date = event.createdAt.toISOString().split('T')[0];
      byDay.set(date, (byDay.get(date) ?? 0) + 1);
    }

    return Array.from(byDay.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }
}
