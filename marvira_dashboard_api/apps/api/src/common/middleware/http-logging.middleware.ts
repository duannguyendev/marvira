import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { NextFunction, Response } from 'express';
import { RequestWithId } from './request-id.middleware';
import { MetricsService } from '../metrics/metrics.service';

@Injectable()
export class HttpLoggingMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  constructor(private readonly metrics: MetricsService) {}

  use(req: RequestWithId, res: Response, next: NextFunction) {
    const start = Date.now();
    res.on('finish', () => {
      const durationMs = Date.now() - start;
      this.metrics.recordRequest(req.method, res.statusCode, durationMs);
      this.logger.log(
        JSON.stringify({
          requestId: req.requestId,
          method: req.method,
          path: req.originalUrl,
          statusCode: res.statusCode,
          durationMs,
        }),
      );
    });
    next();
  }
}
