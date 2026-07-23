import { Controller, Get, Post, Delete, Param, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { FavoritesService } from './favorites.service';
import { Roles } from '../common/decorators/roles.decorator';
import { RequestUser } from '../common/types/request-user';

@ApiTags('favorites')
@Controller('favorites')
@ApiBearerAuth()
@Roles(UserRole.USER, UserRole.STAFF, UserRole.ADMIN)
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Get('events')
  @ApiOperation({ summary: 'List favorite events' })
  async listEvents(@Req() req: { user: RequestUser }) {
    const data = await this.favoritesService.listFavoriteEvents(req.user.id);
    return { success: true, data };
  }

  @Get('questions')
  @ApiOperation({ summary: 'List favorite questions' })
  async listQuestions(@Req() req: { user: RequestUser }) {
    const data = await this.favoritesService.listFavoriteQuestions(req.user.id);
    return { success: true, data };
  }

  @Post('events/:id')
  @ApiOperation({ summary: 'Add event to favorites' })
  async addEvent(@Req() req: { user: RequestUser }, @Param('id') id: string) {
    await this.favoritesService.addFavoriteEvent(req.user.id, id);
    return { success: true, data: null };
  }

  @Delete('events/:id')
  @ApiOperation({ summary: 'Remove event from favorites' })
  async removeEvent(
    @Req() req: { user: RequestUser },
    @Param('id') id: string,
  ) {
    await this.favoritesService.removeFavoriteEvent(req.user.id, id);
    return { success: true, data: null };
  }

  @Post('questions/:id')
  @ApiOperation({ summary: 'Add question to favorites' })
  async addQuestion(
    @Req() req: { user: RequestUser },
    @Param('id') id: string,
  ) {
    await this.favoritesService.addFavoriteQuestion(req.user.id, id);
    return { success: true, data: null };
  }

  @Delete('questions/:id')
  @ApiOperation({ summary: 'Remove question from favorites' })
  async removeQuestion(
    @Req() req: { user: RequestUser },
    @Param('id') id: string,
  ) {
    await this.favoritesService.removeFavoriteQuestion(req.user.id, id);
    return { success: true, data: null };
  }
}
