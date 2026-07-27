import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../common/redis/redis.service';
import {
  APP_SETTING_EVENT_LIVE_DURATION_DAYS,
  DEFAULT_EVENT_LIVE_DURATION_DAYS,
  computeEndsAtFromDays,
  parseEventLiveDurationDays,
} from '../events/event-live-duration';

const CACHE_KEY = 'app_settings:event_live_duration_days';

export interface AppSettingsDto {
  eventLiveDurationDays: number;
}

@Injectable()
export class AppSettingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async getSettings(): Promise<AppSettingsDto> {
    const eventLiveDurationDays = await this.getEventLiveDurationDays();
    return { eventLiveDurationDays };
  }

  async getEventLiveDurationDays(): Promise<number> {
    const cached = await this.redis.get(CACHE_KEY);
    if (cached != null) {
      return parseEventLiveDurationDays(cached);
    }

    const row = await this.prisma.client.appSetting.findUnique({
      where: { key: APP_SETTING_EVENT_LIVE_DURATION_DAYS },
    });

    if (!row) {
      await this.prisma.client.appSetting.create({
        data: {
          key: APP_SETTING_EVENT_LIVE_DURATION_DAYS,
          value: String(DEFAULT_EVENT_LIVE_DURATION_DAYS),
        },
      });
      await this.redis.set(
        CACHE_KEY,
        String(DEFAULT_EVENT_LIVE_DURATION_DAYS),
      );
      return DEFAULT_EVENT_LIVE_DURATION_DAYS;
    }

    const days = parseEventLiveDurationDays(row.value);
    await this.redis.set(CACHE_KEY, String(days));
    return days;
  }

  async computeEndsAt(from: Date = new Date()): Promise<Date> {
    const days = await this.getEventLiveDurationDays();
    return computeEndsAtFromDays(days, from);
  }

  async updateSettings(input: {
    eventLiveDurationDays?: number;
  }): Promise<AppSettingsDto> {
    if (input.eventLiveDurationDays !== undefined) {
      const days = input.eventLiveDurationDays;
      if (!Number.isInteger(days) || days < 1 || days > 3650) {
        throw new BadRequestException(
          'eventLiveDurationDays must be an integer between 1 and 3650',
        );
      }
      await this.prisma.client.appSetting.upsert({
        where: { key: APP_SETTING_EVENT_LIVE_DURATION_DAYS },
        create: {
          key: APP_SETTING_EVENT_LIVE_DURATION_DAYS,
          value: String(days),
        },
        update: { value: String(days) },
      });
      await this.redis.del(CACHE_KEY);
    }

    return this.getSettings();
  }
}
