import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AnticheatModule } from '../anticheat/anticheat.module';
import { EventAccessService } from './event-access.service';

@Module({
  imports: [AuthModule, AnticheatModule],
  providers: [EventAccessService],
  exports: [EventAccessService],
})
export class EventAccessModule {}
