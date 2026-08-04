import './load-env';
import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { BullModule } from '@nestjs/bullmq';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { EventsModule } from './events/events.module';
import { EventPublishModule } from './events/event-publish.module';
import { PlacesModule } from './places/places.module';
import { QuestionsModule } from './questions/questions.module';
import { ProgressModule } from './progress/progress.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { UploadsModule } from './uploads/uploads.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AdminModule } from './admin/admin.module';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './common/redis/redis.module';
import { EmailModule } from './email/email.module';
import { ProfileModule } from './users/profile.module';
import { HealthModule } from './health/health.module';
import { RequestIdMiddleware } from './common/middleware/request-id.middleware';
import { HttpLoggingMiddleware } from './common/middleware/http-logging.middleware';
import { MetricsModule } from './common/metrics/metrics.module';
import { LeaderboardModule } from './leaderboard/leaderboard.module';
import { PracticeModule } from './practice/practice.module';
import { FavoritesModule } from './favorites/favorites.module';
import { AnticheatModule } from './anticheat/anticheat.module';
import { FeedbackModule } from './feedback/feedback.module';
import { ArticlesModule } from './articles/articles.module';
import { AppSettingsModule } from './settings/app-settings.module';
import { getRedisConnectionOptions } from './common/redis/redis-connection';

const redisDisabled = process.env.REDIS_DISABLED === 'true';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    EmailModule,
    MetricsModule,
    AppSettingsModule,
    ThrottlerModule.forRoot([
      { name: 'short', ttl: 1000, limit: 10 },
      { name: 'medium', ttl: 60000, limit: 100 },
    ]),
    ...(redisDisabled
      ? []
      : [
          BullModule.forRoot({
            connection: getRedisConnectionOptions(),
          }),
        ]),
    PrismaModule,
    RedisModule,
    AuthModule,
    UsersModule,
    ProfileModule,
    EventsModule,
    PlacesModule,
    QuestionsModule,
    ProgressModule,
    AnalyticsModule,
    UploadsModule,
    ...(redisDisabled ? [] : [NotificationsModule, EventPublishModule]),
    AdminModule,
    HealthModule,
    LeaderboardModule,
    PracticeModule,
    FavoritesModule,
    AnticheatModule,
    FeedbackModule,
    ArticlesModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    RequestIdMiddleware,
    HttpLoggingMiddleware,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestIdMiddleware, HttpLoggingMiddleware).forRoutes('*');
  }
}
