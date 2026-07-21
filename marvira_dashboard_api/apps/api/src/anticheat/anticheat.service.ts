import { Injectable } from '@nestjs/common';
import { haversineDistanceMeters } from '@marvira/shared-utils';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../common/redis/redis.service';
import {
  ANTICHEAT_CODES,
  ANTICHEAT_WARNING_MESSAGE,
  AnticheatCode,
  getAnticheatConfig,
} from './anticheat.constants';
import { AnticheatContext, LocationInput, LocationWarning } from './anticheat.types';

@Injectable()
export class AnticheatService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async evaluateAndRecord(
    userId: string,
    location: LocationInput,
    context: AnticheatContext,
  ): Promise<LocationWarning[]> {
    const config = getAnticheatConfig();
    if (config.disabled) {
      await this.updateLocationCache(userId, location);
      return [];
    }

    const codes: AnticheatCode[] = [...this.detectViolations(location, config)];

    const movementCode = await this.checkSuspiciousMovement(userId, location, config);
    if (movementCode) {
      codes.push(movementCode);
    }

    const travelCode = this.checkImpossibleTravel(location, context, config);
    if (travelCode) {
      codes.push(travelCode);
    }

    if (codes.length === 0) {
      await this.updateLocationCache(userId, location);
      return [];
    }

    const primaryCode = codes[0];
    const shouldIncrement = await this.shouldIncrementWarningPoint(userId, primaryCode);

    await this.prisma.client.userLocationWarning.create({
      data: {
        userId,
        code: primaryCode,
        placeId: context.placeId,
        eventId: context.eventId,
        payload: {
          latitude: location.latitude,
          longitude: location.longitude,
          accuracy: location.accuracy ?? null,
          timestamp: location.timestamp ?? null,
          triggeredCodes: codes,
        },
      },
    });

    if (shouldIncrement) {
      await this.prisma.client.user.update({
        where: { id: userId },
        data: { warningPoints: { increment: 1 } },
      });
      await this.setWarningCooldown(userId, primaryCode, config.warningCooldownSec);
    }

    await this.updateLocationCache(userId, location);

    return [
      {
        code: primaryCode,
        message: ANTICHEAT_WARNING_MESSAGE,
      },
    ];
  }

  private detectViolations(
    location: LocationInput,
    config: ReturnType<typeof getAnticheatConfig>,
  ): AnticheatCode[] {
    const codes: AnticheatCode[] = [];

    if (location.accuracy != null && location.accuracy > config.maxAccuracyM) {
      codes.push(ANTICHEAT_CODES.POOR_ACCURACY);
    }

    if (location.timestamp != null) {
      const ageSec = Math.abs(Date.now() - location.timestamp) / 1000;
      if (ageSec > config.maxTimestampAgeSec) {
        codes.push(ANTICHEAT_CODES.STALE_LOCATION);
      }
    }

    return codes;
  }

  private async checkSuspiciousMovement(
    userId: string,
    location: LocationInput,
    config: ReturnType<typeof getAnticheatConfig>,
  ): Promise<AnticheatCode | null> {
    const key = `location:${userId}`;
    const prev = await this.redis.get(key);
    if (!prev) return null;

    const { lat, lon, ts } = JSON.parse(prev) as { lat: number; lon: number; ts: number };
    const elapsed = (Date.now() - ts) / 1000;
    if (elapsed <= 0 || elapsed >= config.locationRedisTtlSec) return null;

    const distance = haversineDistanceMeters(lat, lon, location.latitude, location.longitude);
    const speed = distance / elapsed;
    if (speed > config.maxSpeedMps) {
      return ANTICHEAT_CODES.SUSPICIOUS_MOVEMENT;
    }

    return null;
  }

  private checkImpossibleTravel(
    location: LocationInput,
    context: AnticheatContext,
    config: ReturnType<typeof getAnticheatConfig>,
  ): AnticheatCode | null {
    if (context.placeIndex <= 0 || !context.previousPlace) {
      return null;
    }

    const prev = context.previousPlace;
    const distance = haversineDistanceMeters(
      prev.latitude,
      prev.longitude,
      location.latitude,
      location.longitude,
    );

    let minTravelSec = distance / config.maxTravelSpeedMps;
    if (distance < config.minHopDistanceM) {
      minTravelSec = Math.max(minTravelSec, config.minTravelFloorSec);
    }

    const elapsedSec = (Date.now() - prev.unlockedAt.getTime()) / 1000;
    if (elapsedSec < minTravelSec) {
      return ANTICHEAT_CODES.IMPOSSIBLE_TRAVEL;
    }

    return null;
  }

  private async shouldIncrementWarningPoint(userId: string, code: AnticheatCode): Promise<boolean> {
    const key = `anticheat:cooldown:${userId}:${code}`;
    const existing = await this.redis.get(key);
    return !existing;
  }

  private async setWarningCooldown(userId: string, code: AnticheatCode, cooldownSec: number) {
    const key = `anticheat:cooldown:${userId}:${code}`;
    await this.redis.set(key, '1', cooldownSec);
  }

  private async updateLocationCache(userId: string, location: LocationInput) {
    const config = getAnticheatConfig();
    const key = `location:${userId}`;
    await this.redis.set(
      key,
      JSON.stringify({
        lat: location.latitude,
        lon: location.longitude,
        ts: location.timestamp ?? Date.now(),
      }),
      config.locationRedisTtlSec,
    );
  }
}
