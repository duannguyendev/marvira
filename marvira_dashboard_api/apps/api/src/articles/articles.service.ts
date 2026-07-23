import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ArticleStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  buildPaginatedResponse,
  parsePagination,
  slugify,
} from '@marvira/shared-utils';
import { CreateArticleDto, UpdateArticleDto } from './dto/article.dto';

const adminInclude = {
  creator: { select: { id: true, name: true, email: true } },
  event: { select: { id: true, title: true, city: true, isActive: true } },
} as const;

const publicInclude = {
  event: { select: { id: true, title: true, city: true } },
} as const;

type ArticleAdmin = Prisma.ArticleGetPayload<{ include: typeof adminInclude }>;
type ArticlePublic = Prisma.ArticleGetPayload<{
  include: typeof publicInclude;
}>;

@Injectable()
export class ArticlesService {
  constructor(private readonly prisma: PrismaService) {}

  private toAdmin(row: ArticleAdmin) {
    return {
      id: row.id,
      title: row.title,
      slug: row.slug,
      placeName: row.placeName,
      city: row.city,
      excerpt: row.excerpt,
      body: row.body,
      coverImage: row.coverImage,
      status: row.status,
      publishedAt: row.publishedAt?.toISOString() ?? null,
      eventId: row.eventId,
      createdBy: row.createdBy,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      creator: row.creator,
      event: row.event,
    };
  }

  private toPublic(row: ArticlePublic) {
    return {
      id: row.id,
      title: row.title,
      slug: row.slug,
      placeName: row.placeName,
      city: row.city,
      excerpt: row.excerpt,
      body: row.body,
      coverImage: row.coverImage,
      publishedAt: row.publishedAt?.toISOString() ?? null,
      event: row.event,
    };
  }

  private buildSearchFilter(search?: string): Prisma.ArticleWhereInput {
    if (!search?.trim()) return {};
    const term = search.trim();
    return {
      OR: [
        { title: { contains: term, mode: 'insensitive' } },
        { placeName: { contains: term, mode: 'insensitive' } },
        { city: { contains: term, mode: 'insensitive' } },
      ],
    };
  }

  private async ensureUniqueSlug(
    base: string,
    excludeId?: string,
  ): Promise<string> {
    const root = slugify(base) || 'article';
    let candidate = root;
    let suffix = 2;
    // Loop until we find a slug not used by another article.
    while (true) {
      const existing = await this.prisma.client.article.findUnique({
        where: { slug: candidate },
        select: { id: true },
      });
      if (!existing || existing.id === excludeId) return candidate;
      candidate = `${root}-${suffix}`;
      suffix += 1;
    }
  }

  private async assertEventExists(eventId: string) {
    const event = await this.prisma.client.event.findUnique({
      where: { id: eventId },
      select: { id: true },
    });
    if (!event) throw new BadRequestException('Linked event not found');
  }

  // --- Public (marketing) ---

  async findPublished(page = 1, pageSize = 12, search?: string) {
    const { skip, take } = parsePagination({ page, pageSize });
    const where: Prisma.ArticleWhereInput = {
      status: ArticleStatus.PUBLISHED,
      ...this.buildSearchFilter(search),
    };

    const [items, total] = await Promise.all([
      this.prisma.client.article.findMany({
        where,
        include: publicInclude,
        orderBy: [{ publishedAt: 'desc' }, { id: 'desc' }],
        skip,
        take,
      }),
      this.prisma.client.article.count({ where }),
    ]);

    return buildPaginatedResponse(
      items.map(row => this.toPublic(row)),
      total,
      page,
      pageSize,
    );
  }

  async findPublishedBySlug(slug: string) {
    const row = await this.prisma.client.article.findFirst({
      where: { slug, status: ArticleStatus.PUBLISHED },
      include: publicInclude,
    });
    if (!row) throw new NotFoundException('Article not found');

    // Neighbors follow the public list order [publishedAt desc, id desc].
    // "prev" = the newer article shown before this one; "next" = the older one after it.
    const anchor = row.publishedAt ?? row.createdAt;
    const neighborSelect = { slug: true, title: true } as const;
    const [prev, next] = await Promise.all([
      this.prisma.client.article.findFirst({
        where: {
          status: ArticleStatus.PUBLISHED,
          OR: [
            { publishedAt: { gt: anchor } },
            { publishedAt: anchor, id: { gt: row.id } },
          ],
        },
        orderBy: [{ publishedAt: 'asc' }, { id: 'asc' }],
        select: neighborSelect,
      }),
      this.prisma.client.article.findFirst({
        where: {
          status: ArticleStatus.PUBLISHED,
          OR: [
            { publishedAt: { lt: anchor } },
            { publishedAt: anchor, id: { lt: row.id } },
          ],
        },
        orderBy: [{ publishedAt: 'desc' }, { id: 'desc' }],
        select: neighborSelect,
      }),
    ]);

    return { ...this.toPublic(row), prev: prev ?? null, next: next ?? null };
  }

  // --- Admin ---

  async findAllAdmin(
    page = 1,
    pageSize = 20,
    search?: string,
    status?: ArticleStatus,
  ) {
    const { skip, take } = parsePagination({ page, pageSize });
    const where: Prisma.ArticleWhereInput = {
      ...(status ? { status } : {}),
      ...this.buildSearchFilter(search),
    };

    const [items, total] = await Promise.all([
      this.prisma.client.article.findMany({
        where,
        include: adminInclude,
        orderBy: { updatedAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.client.article.count({ where }),
    ]);

    return buildPaginatedResponse(
      items.map(row => this.toAdmin(row)),
      total,
      page,
      pageSize,
    );
  }

  async findOneAdmin(id: string) {
    const row = await this.prisma.client.article.findUnique({
      where: { id },
      include: adminInclude,
    });
    if (!row) throw new NotFoundException('Article not found');
    return this.toAdmin(row);
  }

  async create(dto: CreateArticleDto, userId: string) {
    if (dto.eventId) await this.assertEventExists(dto.eventId);

    const status = dto.status ?? ArticleStatus.DRAFT;
    const slug = await this.ensureUniqueSlug(dto.slug?.trim() || dto.title);

    const row = await this.prisma.client.article.create({
      data: {
        title: dto.title.trim(),
        slug,
        placeName: dto.placeName.trim(),
        city: dto.city?.trim() || null,
        excerpt: dto.excerpt.trim(),
        body: dto.body,
        coverImage: dto.coverImage?.trim() || null,
        status,
        publishedAt: status === ArticleStatus.PUBLISHED ? new Date() : null,
        eventId: dto.eventId || null,
        createdBy: userId,
      },
      include: adminInclude,
    });

    return this.toAdmin(row);
  }

  async update(id: string, dto: UpdateArticleDto) {
    const existing = await this.prisma.client.article.findUnique({
      where: { id },
    });
    if (!existing) throw new NotFoundException('Article not found');

    if (dto.eventId) await this.assertEventExists(dto.eventId);

    const data: Prisma.ArticleUpdateInput = {};

    if (dto.title !== undefined) data.title = dto.title.trim();
    if (dto.slug !== undefined) {
      data.slug = await this.ensureUniqueSlug(
        dto.slug.trim() || existing.title,
        id,
      );
    }
    if (dto.placeName !== undefined) data.placeName = dto.placeName.trim();
    if (dto.city !== undefined) data.city = dto.city.trim() || null;
    if (dto.excerpt !== undefined) data.excerpt = dto.excerpt.trim();
    if (dto.body !== undefined) data.body = dto.body;
    if (dto.coverImage !== undefined)
      data.coverImage = dto.coverImage.trim() || null;
    if (dto.eventId !== undefined) {
      data.event = dto.eventId
        ? { connect: { id: dto.eventId } }
        : { disconnect: true };
    }

    if (dto.status !== undefined && dto.status !== existing.status) {
      data.status = dto.status;
      // Stamp the first publish time; keep the original when re-publishing.
      if (dto.status === ArticleStatus.PUBLISHED && !existing.publishedAt) {
        data.publishedAt = new Date();
      }
    }

    const row = await this.prisma.client.article.update({
      where: { id },
      data,
      include: adminInclude,
    });

    return this.toAdmin(row);
  }

  async remove(id: string) {
    const existing = await this.prisma.client.article.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existing) throw new NotFoundException('Article not found');
    await this.prisma.client.article.delete({ where: { id } });
    return { deleted: true };
  }
}
