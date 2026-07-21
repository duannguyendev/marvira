import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ArticlesService } from './articles.service';
import { Public } from '../common/decorators/roles.decorator';

@ApiTags('articles')
@Controller('articles')
export class ArticlesController {
  constructor(private readonly articlesService: ArticlesService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'List published articles (search by title, place, or city)' })
  async list(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('search') search?: string,
  ) {
    const data = await this.articlesService.findPublished(
      parseInt(page || '1', 10),
      parseInt(pageSize || '12', 10),
      search,
    );
    return { success: true, data };
  }

  @Public()
  @Get(':slug')
  @ApiOperation({ summary: 'Get a published article by slug' })
  async bySlug(@Param('slug') slug: string) {
    const data = await this.articlesService.findPublishedBySlug(slug);
    return { success: true, data };
  }
}
