import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuthProvider, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { buildPaginatedResponse, parsePagination } from '@marvira/shared-utils';

const BCRYPT_ROUNDS = 12;

const userAdminSelect = {
  id: true,
  email: true,
  name: true,
  avatar: true,
  provider: true,
  role: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
  _count: { select: { eventProgress: true } },
} as const;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(page = 1, pageSize = 20, search?: string) {
    const { skip, take } = parsePagination({ page, pageSize });
    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { email: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};
    const [items, total] = await Promise.all([
      this.prisma.client.user.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        select: userAdminSelect,
      }),
      this.prisma.client.user.count({ where }),
    ]);
    return buildPaginatedResponse(items, total, page, pageSize);
  }

  async create(
    input: { email: string; name: string; password: string; role: UserRole },
    actorRole: UserRole,
  ) {
    if (actorRole !== UserRole.ADMIN && actorRole !== UserRole.STAFF) {
      throw new ForbiddenException('Insufficient permissions');
    }
    if (input.role === UserRole.ADMIN && actorRole !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admins can create admin accounts');
    }

    const email = input.email;
    const existing = await this.prisma.client.user.findUnique({ where: { email } });
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);
    return this.prisma.client.user.create({
      data: {
        email,
        name: input.name,
        passwordHash,
        provider: AuthProvider.LOCAL,
        role: input.role,
        isActive: true,
      },
      select: userAdminSelect,
    });
  }

  async deactivate(id: string) {
    const user = await this.prisma.client.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    if (user.role === UserRole.ADMIN) {
      throw new BadRequestException('Cannot deactivate an admin account');
    }
    return this.prisma.client.user.update({
      where: { id },
      data: { isActive: false },
      select: userAdminSelect,
    });
  }

  async activate(id: string) {
    const user = await this.prisma.client.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    return this.prisma.client.user.update({
      where: { id },
      data: { isActive: true },
      select: userAdminSelect,
    });
  }

  async setRole(id: string, role: UserRole, actorId: string) {
    if (id === actorId) {
      throw new ForbiddenException('You cannot change your own role');
    }

    const user = await this.prisma.client.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    if (user.role === UserRole.ADMIN && role !== UserRole.ADMIN) {
      const adminCount = await this.prisma.client.user.count({
        where: { role: UserRole.ADMIN, isActive: true },
      });
      if (adminCount <= 1) {
        throw new BadRequestException('Cannot demote the last active admin');
      }
    }

    return this.prisma.client.user.update({
      where: { id },
      data: { role },
      select: userAdminSelect,
    });
  }

  async getProfile(userId: string) {
    return this.prisma.client.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        provider: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async getUserProgress(userId: string) {
    return this.prisma.client.userEventProgress.findMany({
      where: { userId },
      include: { event: { select: { id: true, title: true, city: true } } },
      orderBy: { startedAt: 'desc' },
    });
  }
}
