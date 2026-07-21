import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RequestUser } from '../common/types/request-user';

@Injectable()
export class EventOwnershipService {
  constructor(private readonly prisma: PrismaService) {}

  async assertCanManage(eventId: string, user: RequestUser): Promise<void> {
    if (user.role === UserRole.ADMIN || user.role === UserRole.STAFF) return;

    const event = await this.prisma.client.event.findUnique({
      where: { id: eventId },
      select: { createdBy: true },
    });
    if (!event) throw new NotFoundException('Event not found');
    if (event.createdBy !== user.id) {
      throw new ForbiddenException('You can only manage your own events');
    }
  }

  async assertCanManagePlace(placeId: string, user: RequestUser): Promise<void> {
    const place = await this.prisma.client.place.findUnique({
      where: { id: placeId },
      include: { event: { select: { createdBy: true } } },
    });
    if (!place) throw new NotFoundException('Place not found');
    if (user.role === UserRole.ADMIN || user.role === UserRole.STAFF) return;
    if (place.event.createdBy !== user.id) {
      throw new ForbiddenException('You can only manage your own events');
    }
  }
}
