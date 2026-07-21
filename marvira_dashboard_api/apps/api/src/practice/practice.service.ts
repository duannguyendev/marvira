import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { QuestionSource, QuestionType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { QuestionsService, CreateQuestionInput } from '../questions/questions.service';
import { buildPaginatedResponse, parsePagination } from '@marvira/shared-utils';

type QuestionWithCreator = {
  id: string;
  question: string;
  type: QuestionType;
  imageUrl: string | null;
  options: unknown;
  answer: string;
  explanation: string | null;
  points: number;
  createdBy: string | null;
  source: QuestionSource;
  isPublished: boolean;
  createdAt: Date;
  creator?: { id: string; name: string } | null;
  places?: Array<{ event: { id: string; title: string } }>;
  eventQuestions?: Array<{ event: { id: string; title: string } }>;
};

@Injectable()
export class PracticeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly questionsService: QuestionsService,
  ) {}

  private mapSource(source: QuestionSource): 'community' | 'event' {
    return source === QuestionSource.COMMUNITY ? 'community' : 'event';
  }

  private getEventMeta(q: QuestionWithCreator) {
    const event =
      q.places?.[0]?.event ?? q.eventQuestions?.[0]?.event ?? null;
    return event ? { eventId: event.id, eventTitle: event.title } : {};
  }

  private toListItem(
    q: QuestionWithCreator,
    opts: {
      favoriteIds: Set<string>;
      completedIds: Set<string>;
      includeAnswer?: boolean;
    },
  ) {
    const authorId = q.createdBy ?? q.creator?.id ?? 'system';
    const authorName = q.creator?.name ?? 'Marvira';
    const eventMeta = this.getEventMeta(q);
    return {
      id: q.id,
      text: q.question,
      type: q.type,
      imageUrl: q.imageUrl,
      options: (q.options as string[] | null) ?? undefined,
      points: q.points,
      ...(opts.includeAnswer ? { answer: q.answer } : {}),
      explanation: q.explanation,
      authorId,
      authorName,
      source: this.mapSource(q.source),
      eventId: eventMeta.eventId,
      eventTitle: eventMeta.eventTitle,
      isPublished: q.isPublished,
      createdAt: q.createdAt.toISOString(),
      isFavorite: opts.favoriteIds.has(q.id),
      isTrainingCompleted: opts.completedIds.has(q.id),
    };
  }

  private async getUserSets(userId: string) {
    const [favorites, completions] = await Promise.all([
      this.prisma.client.userFavoriteQuestion.findMany({
        where: { userId },
        select: { questionId: true },
      }),
      this.prisma.client.userPracticeCompletion.findMany({
        where: { userId },
        select: { questionId: true },
      }),
    ]);
    return {
      favoriteIds: new Set(favorites.map((f) => f.questionId)),
      completedIds: new Set(completions.map((c) => c.questionId)),
    };
  }

  async listPracticeQuestions(
    userId: string,
    status: 'unfinished' | 'completed' = 'unfinished',
    page = 1,
    pageSize = 50,
  ) {
    const { favoriteIds, completedIds } = await this.getUserSets(userId);
    const completedFilter =
      status === 'completed'
        ? { id: { in: [...completedIds] } }
        : { id: { notIn: [...completedIds] } };

    const { skip, take } = parsePagination({ page, pageSize });

    const questions = await this.prisma.client.question.findMany({
      where: {
        source: QuestionSource.COMMUNITY,
        isPublished: true,
        ...completedFilter,
      },
      include: {
        creator: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    });

    const items = questions.map((q) =>
      this.toListItem(q, { favoriteIds, completedIds }),
    );
    const total = await this.prisma.client.question.count({
      where: {
        source: QuestionSource.COMMUNITY,
        isPublished: true,
        ...completedFilter,
      },
    });

    return buildPaginatedResponse(items, total, page, pageSize);
  }

  async getQuestion(userId: string, questionId: string, includeAnswer = false) {
    const question = await this.prisma.client.question.findUnique({
      where: { id: questionId },
      include: { creator: { select: { id: true, name: true } } },
    });
    if (!question) throw new NotFoundException('Question not found');

    const isCommunityPublished =
      question.source === QuestionSource.COMMUNITY && question.isPublished;
    const isAuthor = question.createdBy === userId;

    if (!isCommunityPublished && !isAuthor) {
      throw new NotFoundException('Question not found');
    }

    const { favoriteIds, completedIds } = await this.getUserSets(userId);
    const showAnswer = includeAnswer && isAuthor;

    return this.toListItem(question, {
      favoriteIds,
      completedIds,
      includeAnswer: showAnswer,
    });
  }

  async getQuestionForTraining(userId: string, questionId: string) {
    const item = await this.getQuestion(userId, questionId, true);
    const question = await this.prisma.client.question.findUnique({
      where: { id: questionId },
    });
    if (!question) throw new NotFoundException('Question not found');
    return {
      ...item,
      answer: question.answer,
    };
  }

  async submitAnswer(userId: string, questionId: string, answer: string) {
    const question = await this.prisma.client.question.findUnique({
      where: { id: questionId },
    });
    if (!question || question.source !== QuestionSource.COMMUNITY || !question.isPublished) {
      throw new NotFoundException('Question not found');
    }

    const isCorrect = this.checkAnswer(question, answer);
    if (isCorrect) {
      await this.prisma.client.userPracticeCompletion.upsert({
        where: { userId_questionId: { userId, questionId } },
        create: { userId, questionId },
        update: {},
      });
    }

    return {
      isCorrect,
      message: isCorrect ? 'Correct!' : 'Incorrect, try again!',
      explanation: isCorrect ? question.explanation : null,
    };
  }

  private checkAnswer(
    question: { type: QuestionType; answer: string; options: unknown },
    answer: string,
  ): boolean {
    const normalized = answer.trim().toLowerCase();
    const expected = question.answer.trim().toLowerCase();
    if (question.type === QuestionType.TRUE_FALSE) {
      return normalized === expected;
    }
    if (question.type === QuestionType.MULTIPLE_CHOICE) {
      return normalized === expected;
    }
    return normalized === expected;
  }

  async createCommunityQuestion(userId: string, input: CreateQuestionInput) {
    const base = await this.questionsService.create(input);
    return this.prisma.client.question.update({
      where: { id: base.id },
      data: {
        createdBy: userId,
        source: QuestionSource.COMMUNITY,
        isPublished: true,
      },
      include: { creator: { select: { id: true, name: true } } },
    });
  }

  async updateCommunityQuestion(
    userId: string,
    questionId: string,
    input: Partial<CreateQuestionInput>,
  ) {
    const existing = await this.prisma.client.question.findUnique({
      where: { id: questionId },
    });
    if (!existing) throw new NotFoundException('Question not found');
    if (existing.source !== QuestionSource.COMMUNITY) {
      throw new BadRequestException('Only community questions can be edited here');
    }
    if (existing.createdBy !== userId) {
      throw new ForbiddenException('Not authorized to edit this question');
    }

    await this.questionsService.update(questionId, input);
    return this.getQuestionForTraining(userId, questionId);
  }

  async deleteCommunityQuestion(userId: string, questionId: string) {
    const existing = await this.prisma.client.question.findUnique({
      where: { id: questionId },
      include: { _count: { select: { places: true } } },
    });
    if (!existing) throw new NotFoundException('Question not found');
    if (existing.source !== QuestionSource.COMMUNITY) {
      throw new BadRequestException('Only community questions can be deleted here');
    }
    if (existing.createdBy !== userId) {
      throw new ForbiddenException('Not authorized to delete this question');
    }
    if (existing._count.places > 0) {
      throw new ConflictException('Question is linked to places');
    }

    await this.prisma.client.question.delete({ where: { id: questionId } });
    return { deleted: true };
  }

  async findMine(userId: string) {
    const { favoriteIds, completedIds } = await this.getUserSets(userId);

    const [owned, eventLinked] = await Promise.all([
      this.prisma.client.question.findMany({
        where: { createdBy: userId },
        include: {
          creator: { select: { id: true, name: true } },
          places: { take: 1, include: { event: { select: { id: true, title: true } } } },
          eventQuestions: {
            take: 1,
            include: { event: { select: { id: true, title: true } } },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.client.question.findMany({
        where: {
          source: QuestionSource.EVENT,
          OR: [
            { places: { some: { event: { createdBy: userId } } } },
            { eventQuestions: { some: { event: { createdBy: userId } } } },
          ],
          NOT: { createdBy: userId },
        },
        include: {
          creator: { select: { id: true, name: true } },
          places: { take: 1, include: { event: { select: { id: true, title: true } } } },
          eventQuestions: {
            take: 1,
            include: { event: { select: { id: true, title: true } } },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const byId = new Map<string, QuestionWithCreator>();
    for (const q of [...owned, ...eventLinked]) {
      byId.set(q.id, q);
    }

    return [...byId.values()].map((q) =>
      this.toListItem(q, { favoriteIds, completedIds, includeAnswer: q.createdBy === userId }),
    );
  }

  // --- Admin ---

  async adminListCommunity(
    page = 1,
    pageSize = 20,
    search?: string,
    published?: boolean,
  ) {
    const { skip, take } = parsePagination({ page, pageSize });
    const where = {
      source: QuestionSource.COMMUNITY,
      ...(published !== undefined ? { isPublished: published } : {}),
      ...(search
        ? { question: { contains: search, mode: 'insensitive' as const } }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.client.question.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          creator: { select: { id: true, name: true, email: true } },
          _count: {
            select: {
              practiceCompletions: true,
              favoritedBy: true,
            },
          },
        },
      }),
      this.prisma.client.question.count({ where }),
    ]);

    return buildPaginatedResponse(
      items.map((q) => ({
        ...q,
        options: q.options as string[] | null,
        completionCount: q._count.practiceCompletions,
        favoriteCount: q._count.favoritedBy,
      })),
      total,
      page,
      pageSize,
    );
  }

  async adminSetPublished(questionId: string, isPublished: boolean) {
    const q = await this.prisma.client.question.findUnique({ where: { id: questionId } });
    if (!q || q.source !== QuestionSource.COMMUNITY) {
      throw new NotFoundException('Community question not found');
    }
    return this.prisma.client.question.update({
      where: { id: questionId },
      data: { isPublished },
    });
  }

  async adminStats() {
    const [total, published, completions7d, completions30d] = await Promise.all([
      this.prisma.client.question.count({ where: { source: QuestionSource.COMMUNITY } }),
      this.prisma.client.question.count({
        where: { source: QuestionSource.COMMUNITY, isPublished: true },
      }),
      this.prisma.client.userPracticeCompletion.count({
        where: { completedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
      }),
      this.prisma.client.userPracticeCompletion.count({
        where: { completedAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
      }),
    ]);

    const topPracticed = await this.prisma.client.userPracticeCompletion.groupBy({
      by: ['questionId'],
      _count: { questionId: true },
      orderBy: { _count: { questionId: 'desc' } },
      take: 5,
    });

    const questionIds = topPracticed.map((t) => t.questionId);
    const questions = await this.prisma.client.question.findMany({
      where: { id: { in: questionIds } },
      select: { id: true, question: true },
    });
    const qMap = new Map(questions.map((q) => [q.id, q.question]));

    return {
      totalCommunityQuestions: total,
      publishedCommunityQuestions: published,
      completionsLast7Days: completions7d,
      completionsLast30Days: completions30d,
      topPracticed: topPracticed.map((t) => ({
        questionId: t.questionId,
        text: qMap.get(t.questionId) ?? '',
        count: t._count.questionId,
      })),
    };
  }
}
