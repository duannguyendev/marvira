import { Module } from '@nestjs/common';
import { EventsService } from './events.service';
import { EventsController } from './events.controller';
import { GeoQueryService } from './geo-query.service';
import { EventOwnershipService } from './event-ownership.service';
import { EventAccessModule } from './event-access.module';
import { ProgressModule } from '../progress/progress.module';
import { QuestionsModule } from '../questions/questions.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [ProgressModule, QuestionsModule, EventAccessModule, AuthModule],
  controllers: [EventsController],
  providers: [EventsService, GeoQueryService, EventOwnershipService],
  exports: [EventsService, EventOwnershipService, EventAccessModule],
})
export class EventsModule {}
