import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { ScheduledPublishService } from './scheduled-publish.service';
import { EventEndService } from './event-end.service';

@Processor('event-publish')
export class EventPublishProcessor extends WorkerHost {
  private readonly logger = new Logger(EventPublishProcessor.name);

  constructor(
    private readonly scheduledPublish: ScheduledPublishService,
    private readonly eventEnd: EventEndService,
  ) {
    super();
  }

  async process(
    job: Job<{ eventId?: string; type?: string }>,
  ): Promise<{ activated?: boolean; ended?: boolean; count?: number }> {
    if (job.name === 'safety-scan' || job.data.type === 'safety') {
      const [activated, ended] = await Promise.all([
        this.scheduledPublish.activateDueEvents(),
        this.eventEnd.endDueEvents(),
      ]);
      if (activated > 0 || ended > 0) {
        this.logger.log(
          `Safety scan activated ${activated} / ended ${ended} event(s)`,
        );
      }
      return { count: activated + ended };
    }

    const eventId = job.data.eventId;
    if (!eventId) {
      return {};
    }

    if (job.name === 'end-scheduled') {
      const result = await this.eventEnd.endIfDue(eventId);
      return { ended: result.ended };
    }

    const result = await this.scheduledPublish.activateScheduled(eventId);
    return { activated: result.activated };
  }
}
