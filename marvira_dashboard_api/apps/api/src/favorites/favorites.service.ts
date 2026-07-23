import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PracticeService } from '../practice/practice.service';
import { EventsService } from '../events/events.service';

@Injectable()
export class FavoritesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly practiceService: PracticeService,
    private readonly eventsService: EventsService,
  ) {}

  async listFavoriteEvents(userId: string) {
    const favorites = await this.prisma.client.userFavoriteEvent.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    const events = await Promise.all(
      favorites.map(async f => this.eventsService.findOne(f.eventId)),
    );

    return events;
  }

  async listFavoriteQuestions(userId: string) {
    const favorites = await this.prisma.client.userFavoriteQuestion.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: { questionId: true },
    });

    const items = await Promise.all(
      favorites.map(async f => {
        try {
          return await this.practiceService.getQuestion(userId, f.questionId);
        } catch {
          return null;
        }
      }),
    );

    return items.filter(Boolean);
  }

  async addFavoriteEvent(userId: string, eventId: string) {
    const event = await this.prisma.client.event.findUnique({
      where: { id: eventId },
    });
    if (!event) throw new NotFoundException('Event not found');

    await this.prisma.client.userFavoriteEvent.upsert({
      where: { userId_eventId: { userId, eventId } },
      create: { userId, eventId },
      update: {},
    });
  }

  async removeFavoriteEvent(userId: string, eventId: string) {
    const fav = await this.prisma.client.userFavoriteEvent.findUnique({
      where: { userId_eventId: { userId, eventId } },
    });
    if (!fav) throw new NotFoundException('Favorite not found');
    await this.prisma.client.userFavoriteEvent.delete({
      where: { userId_eventId: { userId, eventId } },
    });
  }

  async addFavoriteQuestion(userId: string, questionId: string) {
    const question = await this.prisma.client.question.findUnique({
      where: { id: questionId },
    });
    if (!question) throw new NotFoundException('Question not found');

    await this.prisma.client.userFavoriteQuestion.upsert({
      where: { userId_questionId: { userId, questionId } },
      create: { userId, questionId },
      update: {},
    });
  }

  async removeFavoriteQuestion(userId: string, questionId: string) {
    const fav = await this.prisma.client.userFavoriteQuestion.findUnique({
      where: { userId_questionId: { userId, questionId } },
    });
    if (!fav) throw new NotFoundException('Favorite not found');
    await this.prisma.client.userFavoriteQuestion.delete({
      where: { userId_questionId: { userId, questionId } },
    });
  }

  async isEventFavorite(userId: string, eventId: string) {
    const fav = await this.prisma.client.userFavoriteEvent.findUnique({
      where: { userId_eventId: { userId, eventId } },
    });
    return !!fav;
  }

  async isQuestionFavorite(userId: string, questionId: string) {
    const fav = await this.prisma.client.userFavoriteQuestion.findUnique({
      where: { userId_questionId: { userId, questionId } },
    });
    return !!fav;
  }
}
