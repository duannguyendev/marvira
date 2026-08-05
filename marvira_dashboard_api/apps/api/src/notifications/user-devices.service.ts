import { Injectable } from '@nestjs/common';
import { DevicePlatform } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { normalizeNotificationLocale } from './notification-copy';

@Injectable()
export class UserDevicesService {
  constructor(private readonly prisma: PrismaService) {}

  async register(
    userId: string,
    input: {
      fcmToken: string;
      platform: DevicePlatform;
      appVersion?: string;
      locale?: string;
    },
  ) {
    const locale = input.locale
      ? normalizeNotificationLocale(input.locale)
      : undefined;

    const existing = await this.prisma.client.userDevice.findUnique({
      where: { fcmToken: input.fcmToken },
    });

    if (existing) {
      return this.prisma.client.userDevice.update({
        where: { fcmToken: input.fcmToken },
        data: {
          userId,
          platform: input.platform,
          appVersion: input.appVersion ?? existing.appVersion,
          locale: locale ?? existing.locale,
          lastSeenAt: new Date(),
        },
      });
    }

    return this.prisma.client.userDevice.create({
      data: {
        userId,
        fcmToken: input.fcmToken,
        platform: input.platform,
        appVersion: input.appVersion,
        locale,
      },
    });
  }

  async unregister(userId: string, fcmToken: string) {
    await this.prisma.client.userDevice.deleteMany({
      where: { userId, fcmToken },
    });
  }

  async listTokens(userId: string) {
    return this.prisma.client.userDevice.findMany({
      where: { userId },
      orderBy: { lastSeenAt: 'desc' },
    });
  }

  async deleteTokens(tokens: string[]) {
    if (!tokens.length) return;
    await this.prisma.client.userDevice.deleteMany({
      where: { fcmToken: { in: tokens } },
    });
  }

  /** Prefer most recently seen device locale for server-side copy. */
  async resolveLocale(userId: string): Promise<string> {
    const device = await this.prisma.client.userDevice.findFirst({
      where: { userId },
      orderBy: { lastSeenAt: 'desc' },
      select: { locale: true },
    });
    return device?.locale || 'en';
  }
}
