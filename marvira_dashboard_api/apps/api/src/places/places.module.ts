import { Module, forwardRef } from '@nestjs/common';
import { PlacesService } from './places.service';
import { PlacesController } from './places.controller';
import { PlaceAnswerReportService } from './place-answer-report.service';
import { ProgressModule } from '../progress/progress.module';
import { QuestionsModule } from '../questions/questions.module';
import { EventsModule } from '../events/events.module';
import { EventAccessModule } from '../events/event-access.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    forwardRef(() => ProgressModule),
    QuestionsModule,
    forwardRef(() => EventsModule),
    EventAccessModule,
    NotificationsModule,
  ],
  controllers: [PlacesController],
  providers: [PlacesService, PlaceAnswerReportService],
  exports: [PlacesService, PlaceAnswerReportService],
})
export class PlacesModule {}
