import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

interface NearbyEventRow {
  id: string;
  title: string;
  description: string;
  city: string;
  cover_image: string | null;
  difficulty: string;
  reward_points: number;
  is_active: boolean;
  scheduled_publish_at: Date | null;
  language: string;
  created_by: string;
  creator_name: string;
  creator_email: string;
  created_at: Date;
  updated_at: Date;
  distance_meters: number;
  nearest_latitude: number;
  nearest_longitude: number;
  places_count: number;
  join_password_hash: string | null;
  gift_teaser: string | null;
  gift_codes: string[];
}

@Injectable()
export class GeoQueryService {
  private readonly logger = new Logger(GeoQueryService.name);
  private postGisAvailable: boolean | null = null;

  constructor(private readonly prisma: PrismaService) {}

  async isPostGisAvailable(): Promise<boolean> {
    if (this.postGisAvailable !== null) {
      return this.postGisAvailable;
    }
    if (process.env.USE_POSTGIS === 'false') {
      this.postGisAvailable = false;
      return false;
    }
    try {
      const rows = await this.prisma.client.$queryRaw<{ exists: boolean }[]>`
        SELECT EXISTS(
          SELECT 1 FROM pg_extension WHERE extname = 'postgis'
        ) AS exists
      `;
      this.postGisAvailable = !!rows[0]?.exists;
      if (this.postGisAvailable) {
        this.logger.log('PostGIS detected — using spatial nearby queries');
      }
    } catch {
      this.postGisAvailable = false;
    }
    return this.postGisAvailable;
  }

  async findNearbyEvents(
    latitude: number,
    longitude: number,
    radiusMeters: number,
    language?: string,
    exceptionEventIds: string[] = [],
  ): Promise<NearbyEventRow[]> {
    const languageClause =
      language == null
        ? Prisma.empty
        : exceptionEventIds.length > 0
          ? Prisma.sql`AND (e.language = ${language} OR e.id IN (${Prisma.join(exceptionEventIds)}))`
          : Prisma.sql`AND e.language = ${language}`;

    return this.prisma.client.$queryRaw<NearbyEventRow[]>`
      SELECT
        e.id,
        e.title,
        e.description,
        e.city,
        e.cover_image,
        e.difficulty,
        e.reward_points,
        e.is_active,
        e.scheduled_publish_at,
        e.language,
        e.join_password_hash,
        e.gift_teaser,
        e.gift_codes,
        e.created_by,
        MAX(u.name) AS creator_name,
        MAX(u.email) AS creator_email,
        e.created_at,
        e.updated_at,
        MIN(
          ST_Distance(
            ST_SetSRID(ST_MakePoint(p.longitude, p.latitude), 4326)::geography,
            ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::geography
          )
        )::float AS distance_meters,
        (
          ARRAY_AGG(
            p.latitude
            ORDER BY ST_Distance(
              ST_SetSRID(ST_MakePoint(p.longitude, p.latitude), 4326)::geography,
              ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::geography
            )
          )
        )[1]::float AS nearest_latitude,
        (
          ARRAY_AGG(
            p.longitude
            ORDER BY ST_Distance(
              ST_SetSRID(ST_MakePoint(p.longitude, p.latitude), 4326)::geography,
              ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::geography
            )
          )
        )[1]::float AS nearest_longitude,
        COUNT(p.id)::int AS places_count
      FROM events e
      INNER JOIN places p ON p.event_id = e.id
      INNER JOIN users u ON u.id = e.created_by
      WHERE (
        e.is_active = true
        OR (
          e.is_active = false
          AND e.ended_at IS NULL
          AND e.scheduled_publish_at IS NOT NULL
          AND e.scheduled_publish_at > NOW()
        )
      )
      ${languageClause}
      GROUP BY e.id
      HAVING MIN(
        ST_Distance(
          ST_SetSRID(ST_MakePoint(p.longitude, p.latitude), 4326)::geography,
          ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::geography
        )
      ) <= ${radiusMeters}
      ORDER BY distance_meters ASC
    `;
  }
}
