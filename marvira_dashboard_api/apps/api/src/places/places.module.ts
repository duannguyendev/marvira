import { Module, forwardRef } from '@nestjs/common';
import { PlacesService } from './places.service';
import { PlacesController } from './places.controller';
import { ProgressModule } from '../progress/progress.module';
import { QuestionsModule } from '../questions/questions.module';
import { EventsModule } from '../events/events.module';
import { EventAccessModule } from '../events/event-access.module';

@Module({
  imports: [
    forwardRef(() => ProgressModule),
    QuestionsModule,
    EventsModule,
    EventAccessModule,
  ],
  controllers: [PlacesController],
  providers: [PlacesService],
  exports: [PlacesService],
})
export class PlacesModule {}
