import { Module, forwardRef } from '@nestjs/common';
import { EventsService } from './events.service';
import { EventsController } from './events.controller';
import { GeoQueryService } from './geo-query.service';
import { EventOwnershipService } from './event-ownership.service';
import { EventAccessModule } from './event-access.module';
import { ProgressModule } from '../progress/progress.module';
import { QuestionsModule } from '../questions/questions.module';
import { AuthModule } from '../auth/auth.module';
import { PublishVerifyService } from './publish-verify.service';
import { ScheduledPublishService } from './scheduled-publish.service';
import { EventEndService } from './event-end.service';
import { PlacesModule } from '../places/places.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    ProgressModule,
    QuestionsModule,
    EventAccessModule,
    AuthModule,
    forwardRef(() => PlacesModule),
    NotificationsModule,
  ],
  controllers: [EventsController],
  providers: [
    EventsService,
    GeoQueryService,
    EventOwnershipService,
    PublishVerifyService,
    ScheduledPublishService,
    EventEndService,
  ],
  exports: [
    EventsService,
    EventOwnershipService,
    EventAccessModule,
    PublishVerifyService,
    ScheduledPublishService,
    EventEndService,
  ],
})
export class EventsModule {}
