import { Module } from '@nestjs/common';
import { ProgressService } from './progress.service';
import { EventAccessModule } from '../events/event-access.module';
import { AnticheatModule } from '../anticheat/anticheat.module';

@Module({
  imports: [EventAccessModule, AnticheatModule],
  providers: [ProgressService],
  exports: [ProgressService],
})
export class ProgressModule {}
