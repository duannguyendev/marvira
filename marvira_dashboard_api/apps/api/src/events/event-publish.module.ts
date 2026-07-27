import { Module, forwardRef } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { EventPublishProcessor } from './event-publish.processor';
import { EventsModule } from './events.module';

/**
 * Registers the BullMQ event-publish queue + worker.
 * Only import when Redis/Bull root is available (AppModule gates this).
 */
@Module({
  imports: [
    BullModule.registerQueue({ name: 'event-publish' }),
    forwardRef(() => EventsModule),
  ],
  providers: [EventPublishProcessor],
})
export class EventPublishModule {}
