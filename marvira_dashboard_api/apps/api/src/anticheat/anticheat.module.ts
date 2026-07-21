import { Module } from '@nestjs/common';
import { AnticheatService } from './anticheat.service';
import { UserModerationService } from './user-moderation.service';
import { AnticheatAdminController } from './anticheat-admin.controller';

@Module({
  controllers: [AnticheatAdminController],
  providers: [AnticheatService, UserModerationService],
  exports: [AnticheatService, UserModerationService],
})
export class AnticheatModule {}
