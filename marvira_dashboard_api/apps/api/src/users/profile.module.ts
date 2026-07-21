import { Module } from '@nestjs/common';
import { ProfileController } from './profile.controller';
import { UsersService } from './users.service';
import { ProgressModule } from '../progress/progress.module';
import { UsersModule } from './users.module';

@Module({
  imports: [UsersModule, ProgressModule],
  controllers: [ProfileController],
})
export class ProfileModule {}
