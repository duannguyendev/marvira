import { Logger } from '@nestjs/common';

const WEAK_JWT_SECRETS = new Set([
  'dev-secret',
  'change-me-in-production-use-long-random-string',
  'dev-jwt-secret-change-in-production',
  'test-secret',
]);

export function validateProductionConfig(logger: Logger): void {
  if (process.env.NODE_ENV !== 'production') {
    return;
  }

  const jwtSecret = process.env.JWT_SECRET?.trim();
  if (!jwtSecret || jwtSecret.length < 32 || WEAK_JWT_SECRETS.has(jwtSecret)) {
    throw new Error(
      'JWT_SECRET must be a random string of at least 32 characters in production',
    );
  }

  if (process.env.REDIS_DISABLED === 'true') {
    throw new Error(
      'REDIS_DISABLED=true is not allowed when NODE_ENV=production',
    );
  }

  if (process.env.OAUTH_DEV_BYPASS !== 'false') {
    throw new Error('Set OAUTH_DEV_BYPASS=false in production');
  }
}
