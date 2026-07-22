import { Injectable, Logger } from '@nestjs/common';
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
  created_by: string;
  created_at: Date;
  updated_at: Date;
  distance_meters: number;
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
  ): Promise<NearbyEventRow[]> {
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
        e.join_password_hash,
        e.gift_teaser,
        e.gift_codes,
        e.created_by,
        e.created_at,
        e.updated_at,
        MIN(
          ST_Distance(
            ST_SetSRID(ST_MakePoint(p.longitude, p.latitude), 4326)::geography,
            ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::geography
          )
        )::float AS distance_meters
      FROM events e
      INNER JOIN places p ON p.event_id = e.id
      WHERE e.is_active = true
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
