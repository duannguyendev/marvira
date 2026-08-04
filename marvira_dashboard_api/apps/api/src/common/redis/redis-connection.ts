import type { RedisOptions } from 'ioredis';

/**
 * Build ioredis / BullMQ connection options from REDIS_URL.
 * Upstash UI copies `redis://…` but TLS is required (redis-cli uses --tls).
 * For ioredis: use rediss:// OR set tls: {} (we auto-enable for *.upstash.io).
 */
export function getRedisConnectionOptions(): RedisOptions {
  const raw = process.env.REDIS_URL?.trim();
  if (!raw) {
    return {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
      maxRetriesPerRequest: null,
      family: 0,
    };
  }

  const u = new URL(raw);
  const isUpstash = u.hostname.endsWith('.upstash.io');
  const useTls = u.protocol === 'rediss:' || isUpstash;

  return {
    family: 0,
    host: u.hostname,
    port: Number(u.port || 6379),
    username: u.username ? decodeURIComponent(u.username) : undefined,
    password: u.password ? decodeURIComponent(u.password) : undefined,
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    ...(useTls ? { tls: {} } : {}),
  };
}
