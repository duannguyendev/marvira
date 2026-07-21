import { Injectable } from '@nestjs/common';

@Injectable()
export class MetricsService {
  private requestsTotal = 0;
  private readonly statusCounts = new Map<string, number>();

  recordRequest(method: string, statusCode: number, durationMs: number) {
    this.requestsTotal += 1;
    const key = `${method}:${statusCode}`;
    this.statusCounts.set(key, (this.statusCounts.get(key) ?? 0) + 1);
    void durationMs;
  }

  prometheusText(): string {
    const lines = [
      '# HELP http_requests_total Total HTTP requests handled',
      '# TYPE http_requests_total counter',
      `http_requests_total ${this.requestsTotal}`,
    ];

    for (const [key, count] of this.statusCounts.entries()) {
      const [method, status] = key.split(':');
      lines.push(`http_requests_by_status{method="${method}",status="${status}"} ${count}`);
    }

    return `${lines.join('\n')}\n`;
  }
}
