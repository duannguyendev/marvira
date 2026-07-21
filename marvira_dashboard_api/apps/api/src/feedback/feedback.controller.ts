import { Controller, Post, Body, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { FeedbackService } from './feedback.service';
import { SubmitFeedbackDto } from './dto/submit-feedback.dto';
import { Public } from '../common/decorators/roles.decorator';
import { RequestUser } from '../common/types/request-user';

@ApiTags('feedback')
@Controller('feedback')
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @Public()
  @Post()
  @Throttle({ short: { limit: 5, ttl: 60000 } })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Submit feedback (guest or authenticated)' })
  async submit(
    @Body() dto: SubmitFeedbackDto,
    @Req() req: { user?: RequestUser | null },
  ) {
    const data = await this.feedbackService.submit(dto, req.user ?? null);
    return { success: true, data, message: 'Thank you for your feedback!' };
  }
}
