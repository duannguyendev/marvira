import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { isAnswerCorrect } from '../common/utils/answer-match.util';

const verifyQuestionSelect = {
  id: true,
  question: true,
  type: true,
  imageUrl: true,
  options: true,
  points: true,
} as const;

export interface PublishVerifyStatus {
  totalCount: number;
  verifiedCount: number;
  verifiedQuestionIds: string[];
  allVerified: boolean;
}

export interface PublishVerifyQuestionItem {
  placeId: string;
  placeTitle: string;
  placeOrderIndex: number;
  question: {
    id: string;
    question: string;
    type: string;
    imageUrl: string | null;
    options: unknown;
    points: number;
  };
  verified: boolean;
}

@Injectable()
export class PublishVerifyService {
  constructor(private readonly prisma: PrismaService) {}

  async getStatus(eventId: string): Promise<PublishVerifyStatus> {
    const questionIds = await this.getEventQuestionIds(eventId);
    const passes = await this.prisma.client.eventPublishVerifyPass.findMany({
      where: { eventId },
      select: { questionId: true },
    });
    const verifiedQuestionIds = passes
      .map(p => p.questionId)
      .filter(id => questionIds.includes(id));
    const verifiedCount = verifiedQuestionIds.length;
    const totalCount = questionIds.length;

    return {
      totalCount,
      verifiedCount,
      verifiedQuestionIds,
      allVerified: totalCount > 0 && verifiedCount === totalCount,
    };
  }

  async getQuestions(eventId: string): Promise<PublishVerifyQuestionItem[]> {
    const places = await this.prisma.client.place.findMany({
      where: { eventId, questionId: { not: null } },
      orderBy: { orderIndex: 'asc' },
      include: {
        question: { select: verifyQuestionSelect },
      },
    });

    const passes = await this.prisma.client.eventPublishVerifyPass.findMany({
      where: { eventId },
      select: { questionId: true },
    });
    const verifiedSet = new Set(passes.map(p => p.questionId));

    return places
      .filter(p => p.question)
      .map(place => ({
        placeId: place.id,
        placeTitle: place.title,
        placeOrderIndex: place.orderIndex,
        question: place.question!,
        verified: verifiedSet.has(place.question!.id),
      }));
  }

  async submitVerify(
    eventId: string,
    questionId: string,
    answer: string,
  ): Promise<{ correct: boolean; verifiedCount: number; totalCount: number }> {
    const place = await this.prisma.client.place.findFirst({
      where: { eventId, questionId },
      include: { question: true },
    });
    if (!place?.question) {
      throw new NotFoundException('Question not found for this event');
    }

    const correct = isAnswerCorrect(place.question, answer);
    if (!correct) {
      const status = await this.getStatus(eventId);
      return {
        correct: false,
        verifiedCount: status.verifiedCount,
        totalCount: status.totalCount,
      };
    }

    await this.prisma.client.eventPublishVerifyPass.upsert({
      where: {
        eventId_questionId: { eventId, questionId },
      },
      create: { eventId, questionId },
      update: { verifiedAt: new Date() },
    });

    const status = await this.getStatus(eventId);
    return {
      correct: true,
      verifiedCount: status.verifiedCount,
      totalCount: status.totalCount,
    };
  }

  async markAllVerifiedFromChecklist(eventId: string): Promise<void> {
    const questionIds = await this.getEventQuestionIds(eventId);
    if (questionIds.length === 0) {
      throw new BadRequestException(
        'Event must have at least one place question before publish review',
      );
    }
    const now = new Date();
    await this.prisma.client.$transaction(
      questionIds.map(questionId =>
        this.prisma.client.eventPublishVerifyPass.upsert({
          where: { eventId_questionId: { eventId, questionId } },
          create: { eventId, questionId, verifiedAt: now },
          update: { verifiedAt: now },
        }),
      ),
    );
  }

  async assertAllVerified(eventId: string): Promise<void> {
    const status = await this.getStatus(eventId);
    if (!status.allVerified) {
      throw new BadRequestException(
        `Answer verification incomplete (${status.verifiedCount}/${status.totalCount}). Re-enter each correct answer before publishing.`,
      );
    }
  }

  async clearVerifyForQuestion(questionId: string): Promise<void> {
    await this.prisma.client.eventPublishVerifyPass.deleteMany({
      where: { questionId },
    });
  }

  async clearVerifyForEvent(eventId: string): Promise<void> {
    await this.prisma.client.eventPublishVerifyPass.deleteMany({
      where: { eventId },
    });
  }

  private async getEventQuestionIds(eventId: string): Promise<string[]> {
    const places = await this.prisma.client.place.findMany({
      where: { eventId, questionId: { not: null } },
      select: { questionId: true },
      orderBy: { orderIndex: 'asc' },
    });
    return places.map(p => p.questionId!).filter(Boolean);
  }
}
