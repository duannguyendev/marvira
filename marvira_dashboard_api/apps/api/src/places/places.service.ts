import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventAccessService } from '../events/event-access.service';

export interface CreatePlaceInput {
  eventId: string;
  title: string;
  description?: string;
  latitude: number;
  longitude: number;
  radiusMeters?: number;
  orderIndex: number;
  hint?: string;
  questionId?: string | null;
}

@Injectable()
export class PlacesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventAccess: EventAccessService,
  ) {}

  private async validateQuestionForEvent(
    eventId: string,
    questionId: string | null | undefined,
  ) {
    if (!questionId) return;
    const link = await this.prisma.client.eventQuestion.findUnique({
      where: { eventId_questionId: { eventId, questionId } },
    });
    if (!link) {
      throw new BadRequestException(
        'Question must be linked to this event before assigning to a place',
      );
    }
  }

  async findByEvent(eventId: string, userId?: string) {
    const event = await this.prisma.client.event.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        createdBy: true,
        joinPasswordHash: true,
        _count: { select: { places: true } },
      },
    });
    if (!event) throw new NotFoundException('Event not found');

    const hasAccess = await this.eventAccess.hasAccess(userId, event);
    if (!hasAccess && this.eventAccess.isPasswordProtected(event)) {
      return [];
    }

    const places = await this.prisma.client.place.findMany({
      where: { eventId },
      orderBy: { orderIndex: 'asc' },
      include: {
        question: {
          select: {
            id: true,
            question: true,
            type: true,
            imageUrl: true,
            points: true,
          },
        },
      },
    });

    if (!userId) return places;

    const completions = await this.prisma.client.userPlaceCompletion.findMany({
      where: { userId, placeId: { in: places.map(p => p.id) } },
    });
    const completionMap = new Map(completions.map(c => [c.placeId, c]));

    const progress = await this.prisma.client.userEventProgress.findUnique({
      where: { userId_eventId: { userId, eventId } },
    });

    return places.map((place, index) => {
      const completion = completionMap.get(place.id);
      const accessible = progress
        ? index <= progress.currentPlaceIndex
        : index === 0;
      return {
        ...place,
        accessible,
        unlocked: !!completion?.unlockedAt,
        completed: completion?.completed ?? false,
      };
    });
  }

  async findOne(id: string) {
    const place = await this.prisma.client.place.findUnique({
      where: { id },
      include: { question: true, event: true },
    });
    if (!place) throw new NotFoundException('Place not found');
    return place;
  }

  async create(data: CreatePlaceInput) {
    await this.validateQuestionForEvent(data.eventId, data.questionId);
    return this.prisma.client.place.create({
      data: {
        ...data,
        description: data.description?.trim() ?? '',
        radiusMeters: data.radiusMeters ?? 100,
      },
      include: { question: true },
    });
  }

  async update(id: string, data: Partial<CreatePlaceInput>) {
    const place = await this.findOne(id);
    if (data.questionId !== undefined) {
      await this.validateQuestionForEvent(place.eventId, data.questionId);
    }
    const { description, ...rest } = data;
    return this.prisma.client.place.update({
      where: { id },
      data: {
        ...rest,
        ...(description !== undefined
          ? { description: description.trim() }
          : {}),
      },
      include: { question: true },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.client.place.delete({ where: { id } });
    return { deleted: true };
  }
}
