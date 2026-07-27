import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { QuestionType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { buildPaginatedResponse, parsePagination } from '@marvira/shared-utils';
import { EventAccessService } from '../events/event-access.service';
import { NotificationsService } from '../notifications/notifications.service';
import { normalizeContentLanguage } from '../common/content-language';

export interface CreateQuestionInput {
  question: string;
  type: QuestionType;
  imageUrl?: string;
  options?: string[];
  answer: string;
  explanation?: string;
  points?: number;
  language?: string;
}

const publicQuestionSelect = {
  id: true,
  question: true,
  type: true,
  imageUrl: true,
  options: true,
  explanation: true,
  points: true,
  answerUpdatedAt: true,
} as const;

@Injectable()
export class QuestionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventAccess: EventAccessService,
    private readonly notifications: NotificationsService,
  ) {}

  private validateQuestionData(data: {
    type: QuestionType;
    imageUrl?: string | null;
    options?: string[] | null;
    answer: string;
  }) {
    if (data.type === QuestionType.IMAGE && !data.imageUrl) {
      throw new BadRequestException(
        'Image URL is required for IMAGE questions',
      );
    }
    if (data.type === QuestionType.MULTIPLE_CHOICE) {
      const options = data.options ?? [];
      if (options.length < 2) {
        throw new BadRequestException(
          'Multiple choice needs at least 2 options',
        );
      }
      if (
        !options.some(
          o => o.trim().toLowerCase() === data.answer.trim().toLowerCase(),
        )
      ) {
        throw new BadRequestException('Answer must match one of the options');
      }
    }
    if (data.type === QuestionType.TRUE_FALSE) {
      const valid = ['true', 'false'];
      if (!valid.includes(data.answer.trim().toLowerCase())) {
        throw new BadRequestException('Answer must be True or False');
      }
    }
  }

  async findAll(page = 1, pageSize = 20, search?: string) {
    const { skip, take } = parsePagination({ page, pageSize });
    const where = search
      ? { question: { contains: search, mode: 'insensitive' as const } }
      : {};

    const [items, total] = await Promise.all([
      this.prisma.client.question.findMany({
        where,
        skip,
        take,
        orderBy: { updatedAt: 'desc' },
        include: {
          _count: { select: { eventQuestions: true, places: true } },
          eventQuestions: {
            take: 5,
            include: { event: { select: { id: true, title: true } } },
          },
        },
      }),
      this.prisma.client.question.count({ where }),
    ]);

    return buildPaginatedResponse(items, total, page, pageSize);
  }

  async findOneAdmin(id: string) {
    const question = await this.prisma.client.question.findUnique({
      where: { id },
      include: {
        eventQuestions: {
          orderBy: { orderIndex: 'asc' },
          include: {
            event: {
              select: { id: true, title: true, city: true, isActive: true },
            },
          },
        },
        places: {
          select: {
            id: true,
            title: true,
            eventId: true,
            event: { select: { title: true } },
          },
        },
      },
    });
    if (!question) throw new NotFoundException('Question not found');
    return question;
  }

  async getQuestionForPlace(userId: string, placeId: string) {
    const place = await this.prisma.client.place.findUnique({
      where: { id: placeId },
      include: { question: { select: publicQuestionSelect } },
    });
    if (!place?.question) throw new NotFoundException('Question not found');

    await this.eventAccess.assertCanPlay(userId, place.eventId);

    const progress = await this.prisma.client.userEventProgress.findUnique({
      where: { userId_eventId: { userId, eventId: place.eventId } },
    });
    if (!progress) throw new ForbiddenException('Place not unlocked');

    const completion = await this.prisma.client.userPlaceCompletion.findUnique({
      where: { userId_placeId: { userId, placeId } },
    });
    if (!completion?.unlockedAt) {
      throw new ForbiddenException('Place not GPS-unlocked yet');
    }

    return place.question;
  }

  async create(data: CreateQuestionInput) {
    this.validateQuestionData({
      type: data.type,
      imageUrl: data.imageUrl,
      options: data.options,
      answer: data.answer,
    });
    return this.prisma.client.question.create({
      data: {
        question: data.question,
        type: data.type,
        imageUrl: data.type === QuestionType.IMAGE ? data.imageUrl : null,
        options: data.options ?? undefined,
        answer: data.answer,
        explanation: data.explanation,
        points: data.points ?? 10,
        language: normalizeContentLanguage(data.language),
      },
    });
  }

  async updateForUser(
    id: string,
    userId: string,
    role: string,
    data: Partial<CreateQuestionInput>,
  ) {
    if (role !== 'ADMIN' && role !== 'STAFF') {
      await this.assertUserOwnsQuestionEvent(id, userId);
    }
    return this.update(id, data);
  }

  private async assertUserOwnsQuestionEvent(
    questionId: string,
    userId: string,
  ) {
    const place = await this.prisma.client.place.findFirst({
      where: { questionId },
      include: { event: { select: { createdBy: true } } },
    });
    if (!place) {
      throw new NotFoundException('Question not linked to an event place');
    }
    if (place.event.createdBy !== userId) {
      throw new ForbiddenException(
        'You can only edit questions on your own events',
      );
    }
  }

  async update(id: string, data: Partial<CreateQuestionInput>) {
    const existing = await this.prisma.client.question.findUnique({
      where: { id },
    });
    if (!existing) throw new NotFoundException('Question not found');

    const merged = {
      type: data.type ?? existing.type,
      imageUrl: data.imageUrl !== undefined ? data.imageUrl : existing.imageUrl,
      options:
        data.options !== undefined
          ? data.options
          : (existing.options as string[] | null),
      answer: data.answer ?? existing.answer,
    };
    this.validateQuestionData(merged);

    const imageUrl =
      (data.type ?? existing.type) === QuestionType.IMAGE
        ? merged.imageUrl
        : null;

    const answerChanged =
      data.answer !== undefined &&
      data.answer.trim().toLowerCase() !== existing.answer.trim().toLowerCase();

    const question = await this.prisma.client.question.update({
      where: { id },
      data: {
        question: data.question,
        type: data.type,
        imageUrl,
        options: data.options,
        answer: data.answer,
        ...(answerChanged ? { answerUpdatedAt: new Date() } : {}),
        ...(data.language !== undefined
          ? { language: normalizeContentLanguage(data.language) }
          : {}),
        explanation: data.explanation,
        points: data.points,
      },
    });

    if (answerChanged) {
      await this.prisma.client.eventPublishVerifyPass.deleteMany({
        where: { questionId: id },
      });
      await this.notifyReportersOfAnswerUpdate(id);
    }

    return question;
  }

  private async notifyReportersOfAnswerUpdate(questionId: string) {
    const places = await this.prisma.client.place.findMany({
      where: { questionId },
      include: { event: { select: { title: true } } },
    });
    if (places.length === 0) return;

    const placeIds = places.map(p => p.id);
    const eventTitle = places[0].event.title;
    const reports = await this.prisma.client.placeAnswerReport.findMany({
      where: { placeId: { in: placeIds } },
      select: { userId: true },
      distinct: ['userId'],
    });

    const message = `An answer was updated in ${eventTitle}. You can try again.`;
    for (const report of reports) {
      await this.notifications.sendNotification(
        report.userId,
        message,
        'answer_updated',
      );
    }
  }

  async remove(id: string) {
    const existing = await this.prisma.client.question.findUnique({
      where: { id },
      include: { _count: { select: { eventQuestions: true, places: true } } },
    });
    if (!existing) throw new NotFoundException('Question not found');
    if (existing._count.places > 0) {
      throw new ConflictException(
        'Question is assigned to places. Unassign it first.',
      );
    }
    await this.prisma.client.question.delete({ where: { id } });
    return { deleted: true };
  }

  async linkToEvent(eventId: string, questionId: string, orderIndex?: number) {
    const [event, question] = await Promise.all([
      this.prisma.client.event.findUnique({ where: { id: eventId } }),
      this.prisma.client.question.findUnique({ where: { id: questionId } }),
    ]);
    if (!event) throw new NotFoundException('Event not found');
    if (!question) throw new NotFoundException('Question not found');

    const existing = await this.prisma.client.eventQuestion.findUnique({
      where: { eventId_questionId: { eventId, questionId } },
    });
    if (existing)
      throw new ConflictException('Question already linked to this event');

    const maxOrder = await this.prisma.client.eventQuestion.aggregate({
      where: { eventId },
      _max: { orderIndex: true },
    });
    const index = orderIndex ?? (maxOrder._max.orderIndex ?? -1) + 1;

    return this.prisma.client.eventQuestion.create({
      data: { eventId, questionId, orderIndex: index },
      include: { question: true },
    });
  }

  async unlinkFromEvent(eventId: string, questionId: string) {
    const link = await this.prisma.client.eventQuestion.findUnique({
      where: { eventId_questionId: { eventId, questionId } },
    });
    if (!link) throw new NotFoundException('Question not linked to this event');

    await this.prisma.client.place.updateMany({
      where: { eventId, questionId },
      data: { questionId: null },
    });
    await this.prisma.client.eventQuestion.delete({
      where: { eventId_questionId: { eventId, questionId } },
    });
    return { unlinked: true };
  }
}
