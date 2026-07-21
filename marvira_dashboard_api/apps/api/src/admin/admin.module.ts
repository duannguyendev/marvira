import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { UsersModule } from '../users/users.module';
import { EventsModule } from '../events/events.module';
import { AnalyticsModule } from '../analytics/analytics.module';
import { QuestionsModule } from '../questions/questions.module';
import { ProgressModule } from '../progress/progress.module';
import { PracticeModule } from '../practice/practice.module';
import { FeedbackModule } from '../feedback/feedback.module';
import { ArticlesModule } from '../articles/articles.module';

@Module({
  imports: [UsersModule, EventsModule, AnalyticsModule, QuestionsModule, ProgressModule, PracticeModule, FeedbackModule, ArticlesModule],
  controllers: [AdminController],
})
export class AdminModule {}
