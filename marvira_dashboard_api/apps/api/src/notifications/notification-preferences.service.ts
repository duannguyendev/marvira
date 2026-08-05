import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateNotificationPreferencesDto } from './dto/update-preferences.dto';

@Injectable()
export class NotificationPreferencesService {
  constructor(private readonly prisma: PrismaService) {}

  async getOrCreate(userId: string) {
    const existing =
      await this.prisma.client.notificationPreference.findUnique({
        where: { userId },
      });
    if (existing) return existing;

    return this.prisma.client.notificationPreference.create({
      data: { userId },
    });
  }

  async update(userId: string, dto: UpdateNotificationPreferencesDto) {
    await this.getOrCreate(userId);
    return this.prisma.client.notificationPreference.update({
      where: { userId },
      data: {
        ...(dto.gameplayEnabled !== undefined
          ? { gameplayEnabled: dto.gameplayEnabled }
          : {}),
        ...(dto.creatorEnabled !== undefined
          ? { creatorEnabled: dto.creatorEnabled }
          : {}),
        ...(dto.productEnabled !== undefined
          ? { productEnabled: dto.productEnabled }
          : {}),
      },
    });
  }

  async isPushEnabled(
    userId: string,
    category: 'GAMEPLAY' | 'CREATOR' | 'PRODUCT',
  ): Promise<boolean> {
    const prefs = await this.getOrCreate(userId);
    if (category === 'GAMEPLAY') return prefs.gameplayEnabled;
    if (category === 'CREATOR') return prefs.creatorEnabled;
    return prefs.productEnabled;
  }
}
