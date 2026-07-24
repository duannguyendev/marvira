import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { EventDifficulty } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../common/redis/redis.service';
import {
  buildPaginatedResponse,
  parsePagination,
  haversineDistanceMeters,
} from '@marvira/shared-utils';
import { GeoQueryService } from './geo-query.service';
import { AuthService } from '../auth/auth.service';
import { EventAccessService } from './event-access.service';
import { CreateEventDto, UpdateEventDto } from './dto/event.dto';
import {
  assertGiftCodesAppendOnly,
  validateGiftFields,
} from './gift-codes.util';
import {
  normalizeContentLanguage,
  parseLanguageFilterQuery,
} from '../common/content-language';

export interface CreateEventInput {
  title: string;
  description: string;
  city: string;
  coverImage?: string;
  difficulty: EventDifficulty;
  rewardPoints: number;
  isActive?: boolean;
  language?: string;
  createdBy: string;
  joinPassword?: string;
  clearJoinPassword?: boolean;
  completionMessage?: string | null;
  giftTeaser?: string | null;
  giftCodes?: string[];
}

const publicQuestionSelect = {
  id: true,
  question: true,
  type: true,
  imageUrl: true,
  options: true,
  explanation: true,
  points: true,
} as const;

@Injectable()
export class EventsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly geoQuery: GeoQueryService,
    private readonly auth: AuthService,
    private readonly eventAccess: EventAccessService,
  ) {}

  async findAll(
    page = 1,
    pageSize = 20,
    activeOnly = true,
    search?: string,
    languageQuery?: string,
    userId?: string,
  ) {
    const { skip, take } = parsePagination({ page, pageSize });
    const searchFilter = search
      ? {
          OR: [
            { title: { contains: search, mode: 'insensitive' as const } },
            { city: { contains: search, mode: 'insensitive' as const } },
            { description: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const exceptionIds = userId
      ? await this.getLanguageExceptionEventIds(userId)
      : [];
    const languageFilter = this.buildLanguageOrExceptionFilter(
      languageQuery,
      exceptionIds,
    );

    const where = {
      ...(activeOnly ? { isActive: true } : {}),
      ...searchFilter,
      ...languageFilter,
    };

    const cacheVersion = await this.getListCacheVersion();
    const cacheKey = `events:list:${cacheVersion}:${page}:${pageSize}:${activeOnly}:${search ?? ''}:${languageQuery ?? 'all'}:${userId ?? 'anon'}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const [items, total] = await Promise.all([
      this.prisma.client.event.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: { _count: { select: { places: true, eventQuestions: true } } },
      }),
      this.prisma.client.event.count({ where }),
    ]);

    const result = buildPaginatedResponse(items, total, page, pageSize);
    const mapped = {
      ...result,
      items: result.items.map(item => this.eventAccess.toPublicFields(item)),
    };
    await this.redis.set(cacheKey, JSON.stringify(mapped), 60);
    return mapped;
  }

  async findNearby(
    latitude: number,
    longitude: number,
    radiusKm = 50,
    languageQuery?: string,
    userId?: string,
  ) {
    const radiusMeters = radiusKm * 1000;
    const exceptionIds = userId
      ? await this.getLanguageExceptionEventIds(userId)
      : [];
    const languageFilter = parseLanguageFilterQuery(languageQuery);

    if (await this.geoQuery.isPostGisAvailable()) {
      try {
        const rows = await this.geoQuery.findNearbyEvents(
          latitude,
          longitude,
          radiusMeters,
          languageFilter === 'all' ? undefined : languageFilter,
          exceptionIds,
        );
        return rows.map(row =>
          this.eventAccess.toPublicFields({
            id: row.id,
            title: row.title,
            description: row.description,
            city: row.city,
            coverImage: row.cover_image,
            difficulty: row.difficulty,
            rewardPoints: row.reward_points,
            isActive: row.is_active,
            language: row.language,
            joinPasswordHash: row.join_password_hash,
            giftTeaser: row.gift_teaser,
            giftCodes: row.gift_codes,
            createdBy: row.created_by,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
            distanceMeters: row.distance_meters,
          }),
        );
      } catch {
        // Fall through to haversine if spatial query fails
      }
    }

    const events = await this.prisma.client.event.findMany({
      where: {
        isActive: true,
        ...this.buildLanguageOrExceptionFilter(languageQuery, exceptionIds),
      },
      include: { places: { select: { latitude: true, longitude: true } } },
    });

    return events
      .map(event => {
        const distances = event.places.map(p =>
          haversineDistanceMeters(latitude, longitude, p.latitude, p.longitude),
        );
        const distanceMeters = distances.length
          ? Math.min(...distances)
          : Infinity;
        return { event, distanceMeters };
      })
      .filter(row => row.distanceMeters <= radiusMeters)
      .sort((a, b) => a.distanceMeters - b.distanceMeters)
      .map(({ event, distanceMeters }) =>
        this.eventAccess.toPublicFields({
          ...event,
          distanceMeters,
        }),
      );
  }

  /**
   * Favorites + in-progress hunts stay visible across language filters.
   */
  private async getLanguageExceptionEventIds(userId: string): Promise<string[]> {
    const [favorites, inProgress] = await Promise.all([
      this.prisma.client.userFavoriteEvent.findMany({
        where: { userId },
        select: { eventId: true },
      }),
      this.prisma.client.userEventProgress.findMany({
        where: { userId, completed: false },
        select: { eventId: true },
      }),
    ]);
    return [
      ...new Set([
        ...favorites.map(f => f.eventId),
        ...inProgress.map(p => p.eventId),
      ]),
    ];
  }

  private buildLanguageOrExceptionFilter(
    languageQuery: string | undefined,
    exceptionIds: string[],
  ): Record<string, unknown> {
    const filter = parseLanguageFilterQuery(languageQuery);
    if (filter === 'all') {
      return {};
    }
    if (exceptionIds.length === 0) {
      return { language: filter };
    }
    return {
      OR: [{ language: filter }, { id: { in: exceptionIds } }],
    };
  }

  async findByCreator(userId: string, page = 1, pageSize = 20) {
    const { skip, take } = parsePagination({ page, pageSize });
    const where = { createdBy: userId };

    const [items, total] = await Promise.all([
      this.prisma.client.event.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: { select: { places: true, eventQuestions: true } },
          places: {
            orderBy: { orderIndex: 'asc' },
            take: 1,
            select: { latitude: true, longitude: true },
          },
        },
      }),
      this.prisma.client.event.count({ where }),
    ]);

    return buildPaginatedResponse(
      items.map(item =>
        this.eventAccess.toPublicFields(item, { includeOwnerGiftFields: true }),
      ),
      total,
      page,
      pageSize,
    );
  }

  async updateForUser(
    id: string,
    userId: string,
    role: string,
    data: Partial<CreateEventInput>,
  ) {
    if (role !== 'ADMIN' && role !== 'STAFF') {
      const event = await this.prisma.client.event.findUnique({
        where: { id },
      });
      if (!event) throw new NotFoundException('Event not found');
      if (event.createdBy !== userId) {
        throw new ForbiddenException('You can only update your own events');
      }
    }
    return this.update(id, data);
  }

  async removeForUser(id: string, userId: string, role: string) {
    if (role !== 'ADMIN' && role !== 'STAFF') {
      const event = await this.prisma.client.event.findUnique({
        where: { id },
      });
      if (!event) throw new NotFoundException('Event not found');
      if (event.createdBy !== userId) {
        throw new ForbiddenException('You can only delete your own events');
      }
    }
    return this.remove(id);
  }

  async findOne(id: string, userId?: string) {
    const event = await this.prisma.client.event.findUnique({
      where: { id },
      include: {
        eventQuestions: {
          orderBy: { orderIndex: 'asc' },
          include: { question: { select: publicQuestionSelect } },
        },
        places: {
          orderBy: { orderIndex: 'asc' },
          include: {
            question: { select: publicQuestionSelect },
          },
        },
        _count: { select: { places: true, eventQuestions: true } },
      },
    });
    if (!event) throw new NotFoundException('Event not found');

    const hasAccess = await this.eventAccess.hasAccess(userId, event);
    const includeOwnerGiftFields =
      !!userId &&
      (event.createdBy === userId || (await this.isStaffOrAdmin(userId)));
    const publicEvent = this.eventAccess.toPublicFields(event, {
      hasAccess,
      includeOwnerGiftFields,
    });

    if (!hasAccess && this.eventAccess.isPasswordProtected(event)) {
      return {
        ...publicEvent,
        places: [],
        eventQuestions: [],
      };
    }

    return publicEvent;
  }

  private async isStaffOrAdmin(userId: string): Promise<boolean> {
    const user = await this.prisma.client.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    return user?.role === 'ADMIN' || user?.role === 'STAFF';
  }

  async findOneAdmin(id: string) {
    const event = await this.prisma.client.event.findUnique({
      where: { id },
      include: {
        eventQuestions: {
          orderBy: { orderIndex: 'asc' },
          include: { question: true },
        },
        places: {
          orderBy: { orderIndex: 'asc' },
          include: { question: true },
        },
        _count: { select: { places: true, eventQuestions: true } },
      },
    });
    if (!event) throw new NotFoundException('Event not found');
    return this.eventAccess.toPublicFields(event, {
      includeOwnerGiftFields: true,
    });
  }

  async create(data: CreateEventInput) {
    if (data.isActive) {
      await this.validateEventForPublish(null, data);
    }
    const {
      joinPassword,
      clearJoinPassword,
      giftCodes,
      giftTeaser,
      completionMessage,
      ...rest
    } = data;
    const createData = await this.applyJoinPasswordFields(
      { joinPasswordHash: null },
      joinPassword,
      clearJoinPassword,
    );
    const giftFields = validateGiftFields({
      giftCodes,
      giftTeaser,
      completionMessage,
    });
    const event = await this.prisma.client.event.create({
      data: {
        ...rest,
        language: normalizeContentLanguage(rest.language),
        ...createData,
        ...giftFields,
      },
    });
    await this.invalidateCache();
    return this.eventAccess.toPublicFields(event, {
      includeOwnerGiftFields: true,
    });
  }

  async update(id: string, data: Partial<CreateEventInput>) {
    const existing = await this.findOneInternal(id);
    if (data.isActive) {
      await this.validateEventForPublish(id);
    }
    const {
      joinPassword,
      clearJoinPassword,
      giftCodes,
      giftTeaser,
      completionMessage,
      ...rest
    } = data;
    const passwordFields = await this.applyJoinPasswordFields(
      existing,
      joinPassword,
      clearJoinPassword,
    );
    if (passwordFields.joinPasswordHash !== existing.joinPasswordHash) {
      await this.eventAccess.invalidateAccessGrants(id);
    }

    const giftPatch = this.buildGiftUpdatePatch(existing, {
      giftCodes,
      giftTeaser,
      completionMessage,
    });

    const event = await this.prisma.client.event.update({
      where: { id },
      data: {
        ...rest,
        ...(rest.language !== undefined
          ? { language: normalizeContentLanguage(rest.language) }
          : {}),
        ...passwordFields,
        ...giftPatch,
      },
    });
    await this.invalidateCache();
    return this.eventAccess.toPublicFields(event, {
      includeOwnerGiftFields: true,
    });
  }

  private buildGiftUpdatePatch(
    existing: {
      giftCodes: string[];
      giftTeaser: string | null;
      completionMessage: string | null;
    },
    input: {
      giftCodes?: string[];
      giftTeaser?: string | null;
      completionMessage?: string | null;
    },
  ): {
    giftCodes?: string[];
    giftTeaser?: string | null;
    completionMessage?: string | null;
  } {
    const touchingGifts =
      input.giftCodes !== undefined ||
      input.giftTeaser !== undefined ||
      input.completionMessage !== undefined;

    if (!touchingGifts) {
      return {};
    }

    const nextCodes =
      input.giftCodes !== undefined ? input.giftCodes : existing.giftCodes;
    const nextTeaser =
      input.giftTeaser !== undefined ? input.giftTeaser : existing.giftTeaser;
    const nextMessage =
      input.completionMessage !== undefined
        ? input.completionMessage
        : existing.completionMessage;

    const validated = validateGiftFields({
      giftCodes: nextCodes,
      giftTeaser: nextTeaser,
      completionMessage: nextMessage,
    });

    if (input.giftCodes !== undefined) {
      assertGiftCodesAppendOnly(existing.giftCodes, validated.giftCodes);
    }

    const patch: {
      giftCodes?: string[];
      giftTeaser?: string | null;
      completionMessage?: string | null;
    } = {};

    if (input.giftCodes !== undefined) patch.giftCodes = validated.giftCodes;
    if (input.giftTeaser !== undefined) patch.giftTeaser = validated.giftTeaser;
    if (input.completionMessage !== undefined) {
      patch.completionMessage = validated.completionMessage;
    }

    // If codes already exist / are being set, ensure teaser stays valid when only codes change
    if (input.giftCodes !== undefined && input.giftTeaser === undefined) {
      patch.giftTeaser = validated.giftTeaser;
    }

    return patch;
  }

  async remove(id: string) {
    await this.findOneInternal(id);
    await this.prisma.client.event.delete({ where: { id } });
    await this.invalidateCache();
    return { deleted: true };
  }

  private async findOneInternal(id: string) {
    const event = await this.prisma.client.event.findUnique({ where: { id } });
    if (!event) throw new NotFoundException('Event not found');
    return event;
  }

  private async applyJoinPasswordFields(
    existing: { joinPasswordHash: string | null },
    joinPassword?: string,
    clearJoinPassword?: boolean,
  ): Promise<{ joinPasswordHash: string | null }> {
    if (clearJoinPassword) {
      return { joinPasswordHash: null };
    }
    if (joinPassword !== undefined) {
      this.eventAccess.validateJoinPassword(joinPassword);
      return { joinPasswordHash: await this.auth.hashPassword(joinPassword) };
    }
    return { joinPasswordHash: existing.joinPasswordHash };
  }

  private async validateEventForPublish(
    eventId: string | null,
    _draft?: Partial<CreateEventInput>,
  ) {
    if (!eventId) {
      throw new BadRequestException(
        'Cannot publish a new event before adding places. Create as draft, add places and questions, then publish.',
      );
    }

    const places = await this.prisma.client.place.findMany({
      where: { eventId },
      select: { id: true, title: true, questionId: true },
    });

    if (places.length === 0) {
      throw new BadRequestException(
        'Event must have at least one place before publishing',
      );
    }

    const missing = places.filter(p => !p.questionId);
    if (missing.length > 0) {
      throw new BadRequestException(
        `Each place must have a question before publishing (${missing.length} place(s) missing)`,
      );
    }
  }

  private async getListCacheVersion(): Promise<string> {
    return (await this.redis.get('events:list:version')) ?? '0';
  }

  private async invalidateCache() {
    await this.redis.incr('events:list:version');
  }
}
