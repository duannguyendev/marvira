import { Module } from '@nestjs/common';
import { FavoritesController } from './favorites.controller';
import { FavoritesService } from './favorites.service';
import { PracticeModule } from '../practice/practice.module';
import { EventsModule } from '../events/events.module';

@Module({
  imports: [PracticeModule, EventsModule],
  controllers: [FavoritesController],
  providers: [FavoritesService],
  exports: [FavoritesService],
})
export class FavoritesModule {}
