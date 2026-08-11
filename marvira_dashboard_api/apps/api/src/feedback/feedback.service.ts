import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  FeedbackCategory,
  FeedbackSource,
  FeedbackStatus,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { buildPaginatedResponse, parsePagination } from '@marvira/shared-utils';
import { SubmitFeedbackDto } from './dto/submit-feedback.dto';
import { UpdateFeedbackDto } from './dto/admin-feedback.dto';
import { RequestUser } from '../common/types/request-user';
import { EmailService } from '../email/email.service';

type FeedbackWithUser = Prisma.FeedbackGetPayload<{
  include: { user: { select: { id: true; name: true; email: true } } };
}>;

@Injectable()
export class FeedbackService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  private toItem(row: FeedbackWithUser) {
    return {
      id: row.id,
      userId: row.userId,
      name: row.name,
      email: row.email,
      category: row.category,
      subject: row.subject,
      message: row.message,
      source: row.source,
      status: row.status,
      adminNote: row.adminNote,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      user: row.user,
    };
  }

  async submit(dto: SubmitFeedbackDto, user?: RequestUser | null) {
    let name: string;
    let email: string;
    let userId: string | null = null;

    if (user) {
      name = dto.name?.trim() || user.name;
      email = dto.email?.trim() || user.email;
      userId = user.id;
    } else {
      if (!dto.name?.trim() || !dto.email?.trim()) {
        throw new BadRequestException(
          'Name and email are required for guest submissions',
        );
      }
      name = dto.name.trim();
      email = dto.email.trim();
    }

    const row = await this.prisma.client.feedback.create({
      data: {
        userId,
        name,
        email,
        category: dto.category,
        subject: dto.subject?.trim() || null,
        message: dto.message.trim(),
        source: dto.source,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    // Fire-and-forget — do not block the user on SMTP/Resend latency.
    void this.emailService.sendSupportFeedbackNotification({
      id: row.id,
      name: row.name,
      email: row.email,
      category: row.category,
      subject: row.subject,
      message: row.message,
      source: row.source,
    });

    return this.toItem(row);
  }

  async findAll(
    page = 1,
    pageSize = 20,
    search?: string,
    status?: FeedbackStatus,
    category?: FeedbackCategory,
    source?: FeedbackSource,
    dateFrom?: string,
    dateTo?: string,
  ) {
    const { skip, take } = parsePagination({ page, pageSize });

    const where: Prisma.FeedbackWhereInput = {};

    if (status) {
      where.status = status;
    }
    if (category) {
      where.category = category;
    }
    if (source) {
      where.source = source;
    }
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) {
        where.createdAt.gte = new Date(dateFrom);
      }
      if (dateTo) {
        const end = new Date(dateTo);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }
    if (search?.trim()) {
      const term = search.trim();
      where.OR = [
        { name: { contains: term, mode: 'insensitive' } },
        { email: { contains: term, mode: 'insensitive' } },
        { subject: { contains: term, mode: 'insensitive' } },
        { message: { contains: term, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.client.feedback.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.client.feedback.count({ where }),
    ]);

    return buildPaginatedResponse(
      items.map(row => this.toItem(row)),
      total,
      page,
      pageSize,
    );
  }

  async findOne(id: string) {
    const row = await this.prisma.client.feedback.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });
    if (!row) {
      throw new NotFoundException('Feedback not found');
    }
    return this.toItem(row);
  }

  async update(id: string, dto: UpdateFeedbackDto) {
    await this.findOne(id);

    const row = await this.prisma.client.feedback.update({
      where: { id },
      data: {
        ...(dto.status !== undefined ? { status: dto.status } : {}),
        ...(dto.adminNote !== undefined ? { adminNote: dto.adminNote } : {}),
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    return this.toItem(row);
  }
}
