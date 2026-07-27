import { Module } from '@nestjs/common';
import { QuestionsService } from './questions.service';
import { QuestionsController } from './questions.controller';
import { EventAccessModule } from '../events/event-access.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [EventAccessModule, NotificationsModule],
  controllers: [QuestionsController],
  providers: [QuestionsService],
  exports: [QuestionsService],
})
export class QuestionsModule {}
