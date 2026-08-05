import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export type NotificationDto = {
  id: string;
  type: string;
  category: string;
  title: string;
  body: string;
  data: Record<string, unknown>;
  relatedEntityType: string | null;
  relatedEntityId: string | null;
  readAt: string | null;
  createdAt: string;
};

@Injectable()
export class NotificationsInboxService {
  constructor(private readonly prisma: PrismaService) {}

  private toDto(row: {
    id: string;
    type: string;
    category: string;
    title: string;
    body: string;
    data: unknown;
    relatedEntityType: string | null;
    relatedEntityId: string | null;
    readAt: Date | null;
    createdAt: Date;
  }): NotificationDto {
    return {
      id: row.id,
      type: row.type,
      category: row.category,
      title: row.title,
      body: row.body,
      data:
        row.data && typeof row.data === 'object' && !Array.isArray(row.data)
          ? (row.data as Record<string, unknown>)
          : {},
      relatedEntityType: row.relatedEntityType,
      relatedEntityId: row.relatedEntityId,
      readAt: row.readAt?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
    };
  }

  async list(
    userId: string,
    opts: { cursor?: string; limit?: number; unreadOnly?: boolean },
  ) {
    const take = Math.min(Math.max(opts.limit ?? 20, 1), 50);

    let cursorCreatedAt: Date | undefined;
    if (opts.cursor) {
      const cursorRow = await this.prisma.client.notification.findFirst({
        where: { id: opts.cursor, userId },
        select: { createdAt: true },
      });
      cursorCreatedAt = cursorRow?.createdAt;
    }

    const where = {
      userId,
      ...(opts.unreadOnly ? { readAt: null } : {}),
      ...(cursorCreatedAt ? { createdAt: { lt: cursorCreatedAt } } : {}),
    };

    const [rows, unreadCount] = await Promise.all([
      this.prisma.client.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: take + 1,
      }),
      this.prisma.client.notification.count({
        where: { userId, readAt: null },
      }),
    ]);

    const hasMore = rows.length > take;
    const page = hasMore ? rows.slice(0, take) : rows;
    const nextCursor = hasMore ? page[page.length - 1]?.id : undefined;

    return {
      items: page.map(r => this.toDto(r)),
      nextCursor,
      unreadCount,
    };
  }

  async unreadCount(userId: string) {
    const unreadCount = await this.prisma.client.notification.count({
      where: { userId, readAt: null },
    });
    return { unreadCount };
  }

  async getOne(userId: string, id: string) {
    const row = await this.prisma.client.notification.findFirst({
      where: { id, userId },
    });
    if (!row) throw new NotFoundException('Notification not found');
    return this.toDto(row);
  }

  async markRead(userId: string, id: string) {
    const existing = await this.prisma.client.notification.findFirst({
      where: { id, userId },
    });
    if (!existing) throw new NotFoundException('Notification not found');
    if (existing.readAt) return this.toDto(existing);

    const row = await this.prisma.client.notification.update({
      where: { id },
      data: { readAt: new Date() },
    });
    return this.toDto(row);
  }

  async markAllRead(userId: string) {
    const result = await this.prisma.client.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });
    return { updated: result.count };
  }
}
