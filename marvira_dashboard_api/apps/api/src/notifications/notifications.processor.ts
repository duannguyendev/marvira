import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';

/**
 * Stub workers — only registered when BULL_STUB_QUEUES=true.
 * Default soft-launch builds skip these to avoid Upstash command burn.
 */
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

  async process(
    job: Job<{ eventName: string; payload: Record<string, unknown> }>,
  ) {
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
