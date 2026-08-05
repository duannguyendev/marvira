import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/** Daily DB cleanup without BullMQ — avoids idle Redis worker polling. */
const CLEANUP_INTERVAL_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class SessionCleanupService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SessionCleanupService.name);
  private timer: ReturnType<typeof setInterval> | null = null;

  constructor(private readonly prisma: PrismaService) {}

  onModuleInit() {
    // Run once shortly after boot, then daily
    void this.runCleanup().catch(err =>
      this.logger.warn(`Initial cleanup failed: ${err}`),
    );
    this.timer = setInterval(() => {
      void this.runCleanup().catch(err =>
        this.logger.warn(`Scheduled cleanup failed: ${err}`),
      );
    }, CLEANUP_INTERVAL_MS);
    this.logger.log('Session cleanup scheduled (daily, no Bull worker)');
  }

  onModuleDestroy() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  async runCleanup() {
    const sessions = await this.prisma.client.session.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
    const resetTokens = await this.prisma.client.passwordResetToken.deleteMany({
      where: {
        OR: [{ expiresAt: { lt: new Date() } }, { usedAt: { not: null } }],
      },
    });
    this.logger.log(
      `Cleanup: ${sessions.count} sessions, ${resetTokens.count} reset tokens removed`,
    );
  }
}
