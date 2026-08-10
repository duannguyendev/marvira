import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ModerationActionType, Prisma } from '@prisma/client';
import { buildPaginatedResponse, parsePagination } from '@marvira/shared-utils';
import { PrismaService } from '../prisma/prisma.service';
import { getAnticheatConfig } from './anticheat.constants';
import { SuspendDuration } from './anticheat.types';

const SUSPEND_DURATIONS: Record<
  SuspendDuration,
  { days: number; action: ModerationActionType }
> = {
  '1d': { days: 1, action: ModerationActionType.SUSPEND_PLAY_1_DAY },
  '2d': { days: 2, action: ModerationActionType.SUSPEND_PLAY_2_DAYS },
  '1w': { days: 7, action: ModerationActionType.SUSPEND_PLAY_1_WEEK },
  '1m': { days: 30, action: ModerationActionType.SUSPEND_PLAY_1_MONTH },
};

@Injectable()
export class UserModerationService {
  constructor(private readonly prisma: PrismaService) {}

  async assertCanPlay(userId: string): Promise<void> {
    const user = await this.prisma.client.user.findUnique({
      where: { id: userId },
      select: { isActive: true, playSuspendedUntil: true, warningPoints: true },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (!user.isActive) {
      throw new ForbiddenException('Your account has been deactivated');
    }

    await this.maybeAutoResetWarningPoints(userId, user.warningPoints);

    const refreshed = await this.prisma.client.user.findUnique({
      where: { id: userId },
      select: { playSuspendedUntil: true },
    });

    if (
      refreshed?.playSuspendedUntil &&
      refreshed.playSuspendedUntil > new Date()
    ) {
      throw new ForbiddenException(
        'Your account is temporarily restricted from playing. Please try again later.',
      );
    }
  }

  private async maybeAutoResetWarningPoints(
    userId: string,
    currentPoints: number,
  ) {
    if (currentPoints <= 0) return;

    const config = getAnticheatConfig();
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - config.autoResetCleanDays);

    const recentWarning =
      await this.prisma.client.userLocationWarning.findFirst({
        where: { userId, createdAt: { gte: cutoff } },
        select: { id: true },
      });

    if (recentWarning) return;

    await this.prisma.client.user.update({
      where: { id: userId },
      data: { warningPoints: 0 },
    });

    const systemAdmin = await this.prisma.client.user.findFirst({
      where: { role: 'ADMIN', isActive: true },
      select: { id: true },
    });

    if (systemAdmin) {
      await this.prisma.client.userModerationAction.create({
        data: {
          userId,
          adminId: systemAdmin.id,
          action: ModerationActionType.RESET_WARNING_POINTS,
          reason: 'auto_90d_clean',
          metadata: { previousPoints: currentPoints },
        },
      });
    }
  }

  async listFlaggedUsers(
    page = 1,
    pageSize = 20,
    search?: string,
    minWarningPoints = 1,
    suspendedOnly?: boolean,
  ) {
    const { skip, take } = parsePagination({ page, pageSize });
    const now = new Date();

    const where: Prisma.UserWhereInput = {
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' as const } },
              { email: { contains: search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
      ...(suspendedOnly
        ? { playSuspendedUntil: { gt: now } }
        : minWarningPoints > 0
          ? {
              OR: [
                { warningPoints: { gte: minWarningPoints } },
                { playSuspendedUntil: { gt: now } },
              ],
            }
          : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.client.user.findMany({
        where,
        skip,
        take,
        orderBy: [{ warningPoints: 'desc' }, { updatedAt: 'desc' }],
        select: {
          id: true,
          email: true,
          name: true,
          warningPoints: true,
          playSuspendedUntil: true,
          isActive: true,
          createdAt: true,
          locationWarnings: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: { createdAt: true, code: true, payload: true },
          },
          _count: { select: { locationWarnings: true } },
        },
      }),
      this.prisma.client.user.count({ where }),
    ]);

    const userIds = items.map(user => user.id);
    const reasonRows =
      userIds.length > 0
        ? await this.prisma.client.userLocationWarning.groupBy({
            by: ['userId', 'code'],
            where: { userId: { in: userIds } },
            _count: { _all: true },
          })
        : [];

    const reasonsByUser = new Map<
      string,
      Array<{ code: string; count: number }>
    >();
    for (const row of reasonRows) {
      const list = reasonsByUser.get(row.userId) ?? [];
      list.push({ code: row.code, count: row._count._all });
      reasonsByUser.set(row.userId, list);
    }
    for (const list of reasonsByUser.values()) {
      list.sort((a, b) => b.count - a.count);
    }

    const mapped = items.map(user => {
      const last = user.locationWarnings[0];
      const payload =
        last?.payload && typeof last.payload === 'object'
          ? (last.payload as Record<string, unknown>)
          : null;
      const triggered = Array.isArray(payload?.triggeredCodes)
        ? (payload.triggeredCodes as string[])
        : last?.code
          ? [last.code]
          : [];

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        warningPoints: user.warningPoints,
        playSuspendedUntil: user.playSuspendedUntil?.toISOString() ?? null,
        isActive: user.isActive,
        createdAt: user.createdAt.toISOString(),
        lastWarningAt: last?.createdAt.toISOString() ?? null,
        lastWarningCode: last?.code ?? null,
        lastTriggeredCodes: triggered,
        warningReasons: reasonsByUser.get(user.id) ?? [],
        totalWarnings: user._count.locationWarnings,
      };
    });

    return buildPaginatedResponse(mapped, total, page, pageSize);
  }

  async getUserDetail(userId: string) {
    const user = await this.prisma.client.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        warningPoints: true,
        playSuspendedUntil: true,
        isActive: true,
        createdAt: true,
        _count: { select: { locationWarnings: true } },
      },
    });
    if (!user) throw new NotFoundException('User not found');

    const [recentWarnings, moderationHistory] = await Promise.all([
      this.prisma.client.userLocationWarning.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
      this.prisma.client.userModerationAction.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 20,
        include: { admin: { select: { id: true, name: true, email: true } } },
      }),
    ]);

    return {
      user: {
        ...user,
        playSuspendedUntil: user.playSuspendedUntil?.toISOString() ?? null,
        createdAt: user.createdAt.toISOString(),
        totalWarnings: user._count.locationWarnings,
      },
      recentWarnings: recentWarnings.map(w => ({
        id: w.id,
        code: w.code,
        placeId: w.placeId,
        eventId: w.eventId,
        payload: w.payload,
        createdAt: w.createdAt.toISOString(),
      })),
      moderationHistory: moderationHistory.map(a => ({
        id: a.id,
        action: a.action,
        reason: a.reason,
        metadata: a.metadata,
        createdAt: a.createdAt.toISOString(),
        admin: a.admin,
      })),
    };
  }

  async listWarnings(userId: string, page = 1, pageSize = 20) {
    const { skip, take } = parsePagination({ page, pageSize });
    const where = { userId };

    const [items, total] = await Promise.all([
      this.prisma.client.userLocationWarning.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.client.userLocationWarning.count({ where }),
    ]);

    return buildPaginatedResponse(
      items.map(w => ({
        id: w.id,
        code: w.code,
        placeId: w.placeId,
        eventId: w.eventId,
        payload: w.payload,
        createdAt: w.createdAt.toISOString(),
      })),
      total,
      page,
      pageSize,
    );
  }

  async suspendPlay(
    userId: string,
    adminId: string,
    duration: SuspendDuration,
    reason?: string,
  ) {
    const user = await this.requireActiveUser(userId);
    const { days, action } = SUSPEND_DURATIONS[duration];
    const until = new Date();
    until.setDate(until.getDate() + days);

    await this.prisma.client.user.update({
      where: { id: userId },
      data: { playSuspendedUntil: until },
    });

    await this.logAction(userId, adminId, action, reason, {
      playSuspendedUntil: until.toISOString(),
    });
    return { playSuspendedUntil: until.toISOString() };
  }

  async liftSuspension(userId: string, adminId: string, reason?: string) {
    await this.requireUser(userId);
    await this.prisma.client.user.update({
      where: { id: userId },
      data: { playSuspendedUntil: null },
    });
    await this.logAction(
      userId,
      adminId,
      ModerationActionType.LIFT_SUSPENSION,
      reason,
    );
    return { playSuspendedUntil: null };
  }

  async resetWarningPoints(userId: string, adminId: string, reason?: string) {
    const user = await this.requireUser(userId);
    const previousPoints = user.warningPoints;
    await this.prisma.client.user.update({
      where: { id: userId },
      data: { warningPoints: 0 },
    });
    await this.logAction(
      userId,
      adminId,
      ModerationActionType.RESET_WARNING_POINTS,
      reason,
      {
        previousPoints,
      },
    );
    return { warningPoints: 0 };
  }

  async deactivateUser(userId: string, adminId: string, reason?: string) {
    await this.requireUser(userId);
    await this.prisma.client.user.update({
      where: { id: userId },
      data: { isActive: false, playSuspendedUntil: null },
    });
    await this.logAction(
      userId,
      adminId,
      ModerationActionType.DEACTIVATE,
      reason,
    );
    return { isActive: false };
  }

  async activateUser(userId: string, adminId: string, reason?: string) {
    await this.requireUser(userId);
    await this.prisma.client.user.update({
      where: { id: userId },
      data: { isActive: true },
    });
    await this.logAction(
      userId,
      adminId,
      ModerationActionType.ACTIVATE,
      reason,
    );
    return { isActive: true };
  }

  private async requireUser(userId: string) {
    const user = await this.prisma.client.user.findUnique({
      where: { id: userId },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  private async requireActiveUser(userId: string) {
    const user = await this.requireUser(userId);
    if (!user.isActive) {
      throw new BadRequestException(
        'Cannot suspend play for a deactivated account',
      );
    }
    return user;
  }

  private async logAction(
    userId: string,
    adminId: string,
    action: ModerationActionType,
    reason?: string,
    metadata?: Prisma.InputJsonValue,
  ) {
    await this.prisma.client.userModerationAction.create({
      data: {
        userId,
        adminId,
        action,
        reason,
        metadata,
      },
    });
  }
}
