import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger, OnModuleInit } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Job, Queue } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';

@Processor('notifications')
export class NotificationsProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationsProcessor.name);

  async process(job: Job<{ userId: string; message: string; type: string }>) {
    this.logger.log(
      `Notification [${job.data.type}] for user ${job.data.userId}: ${job.data.message}`,
    );
    return { sent: true };
  }
}

@Processor('analytics')
export class AnalyticsProcessor extends WorkerHost {
  private readonly logger = new Logger(AnalyticsProcessor.name);

  async process(job: Job<{ eventName: string; payload: Record<string, unknown> }>) {
    this.logger.log(`Analytics event: ${job.data.eventName}`);
    return { processed: true };
  }
}

@Processor('image-processing')
export class ImageProcessingProcessor extends WorkerHost {
  private readonly logger = new Logger(ImageProcessingProcessor.name);

  async process(job: Job<{ filename: string }>) {
    this.logger.log(`Processing image: ${job.data.filename}`);
    return { processed: true };
  }
}

@Processor('cleanup')
export class CleanupProcessor extends WorkerHost implements OnModuleInit {
  private readonly logger = new Logger(CleanupProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue('cleanup') private readonly cleanupQueue: Queue,
  ) {
    super();
  }

  async onModuleInit() {
    await this.cleanupQueue.add(
      'scheduled',
      { type: 'all' },
      {
        repeat: { every: 60 * 60 * 1000 },
        jobId: 'cleanup-hourly',
      },
    );
  }

  async process(job: Job<{ type: string }>) {
    const type = job.data.type;
    let sessions = 0;
    let resetTokens = 0;

    if (type === 'all' || type === 'expired-sessions') {
      const result = await this.prisma.client.session.deleteMany({
        where: { expiresAt: { lt: new Date() } },
      });
      sessions = result.count;
    }

    if (type === 'all' || type === 'expired-reset-tokens') {
      const result = await this.prisma.client.passwordResetToken.deleteMany({
        where: {
          OR: [{ expiresAt: { lt: new Date() } }, { usedAt: { not: null } }],
        },
      });
      resetTokens = result.count;
    }

    this.logger.log(`Cleanup: ${sessions} sessions, ${resetTokens} reset tokens removed`);
    return { sessions, resetTokens };
  }
}
