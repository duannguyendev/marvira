import { Module, forwardRef } from '@nestjs/common';
import { ProgressService } from './progress.service';
import { WebsocketModule } from '../websocket/websocket.module';
import { EventAccessModule } from '../events/event-access.module';
import { AnticheatModule } from '../anticheat/anticheat.module';

@Module({
  imports: [forwardRef(() => WebsocketModule), EventAccessModule, AnticheatModule],
  providers: [ProgressService],
  exports: [ProgressService],
})
export class ProgressModule {}
