import { Module } from '@nestjs/common';
import { LeaderboardController } from './leaderboard.controller';
import { ProgressModule } from '../progress/progress.module';

@Module({
  imports: [ProgressModule],
  controllers: [LeaderboardController],
})
export class LeaderboardModule {}
