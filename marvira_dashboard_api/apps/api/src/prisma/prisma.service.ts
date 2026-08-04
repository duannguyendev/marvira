import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

const prismaClient =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prismaClient;
}

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  get client() {
    return prismaClient;
  }

  async onModuleInit() {
    const timeoutMs = 20_000;
    await Promise.race([
      prismaClient.$connect(),
      new Promise((_, reject) =>
        setTimeout(
          () =>
            reject(
              new Error(
                `Prisma $connect timed out after ${timeoutMs}ms — check DATABASE_URL (use Railway Postgres variable reference)`,
              ),
            ),
          timeoutMs,
        ),
      ),
    ]);
  }

  async onModuleDestroy() {
    await prismaClient.$disconnect();
  }
}
