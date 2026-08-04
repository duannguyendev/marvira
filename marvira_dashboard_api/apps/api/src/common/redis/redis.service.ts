import { Global, Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';
import { getRedisConnectionOptions } from './redis-connection';

interface MemoryEntry {
  value: string;
  expiresAt?: number;
}

@Global()
@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private readonly client: Redis | null;
  private readonly memory = new Map<string, MemoryEntry>();
  readonly useMemory: boolean;

  constructor() {
    this.useMemory = process.env.REDIS_DISABLED === 'true';
    if (this.useMemory && process.env.NODE_ENV === 'production') {
      throw new Error(
        'REDIS_DISABLED=true is not allowed when NODE_ENV=production',
      );
    }
    if (this.useMemory) {
      this.client = null;
      this.logger.warn('Redis disabled — using in-memory cache (dev mode)');
      return;
    }

    this.client = new Redis(getRedisConnectionOptions());
    this.client.on('error', err => {
      this.logger.error(`Redis error: ${err.message}`);
    });
    this.client.on('connect', () => {
      this.logger.log('Redis connected');
    });
  }

  get redis(): Redis {
    if (!this.client) {
      throw new Error('Redis client not available');
    }
    return this.client;
  }

  private readMemory(key: string): string | null {
    const entry = this.memory.get(key);
    if (!entry) return null;
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.memory.delete(key);
      return null;
    }
    return entry.value;
  }

  async get(key: string): Promise<string | null> {
    if (this.useMemory) return this.readMemory(key);
    return this.client!.get(key);
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (this.useMemory) {
      this.memory.set(key, {
        value,
        expiresAt: ttlSeconds ? Date.now() + ttlSeconds * 1000 : undefined,
      });
      return;
    }
    if (ttlSeconds) {
      await this.client!.setex(key, ttlSeconds, value);
    } else {
      await this.client!.set(key, value);
    }
  }

  async del(...keys: string[]): Promise<void> {
    if (this.useMemory) {
      keys.forEach(k => this.memory.delete(k));
      return;
    }
    if (keys.length) await this.client!.del(...keys);
  }

  async incr(key: string): Promise<number> {
    if (this.useMemory) {
      const current = Number(this.readMemory(key) ?? 0) + 1;
      const entry = this.memory.get(key);
      this.memory.set(key, {
        value: String(current),
        expiresAt: entry?.expiresAt,
      });
      return current;
    }
    return this.client!.incr(key);
  }

  async expire(key: string, ttlSeconds: number): Promise<void> {
    if (this.useMemory) {
      const entry = this.memory.get(key);
      if (entry) entry.expiresAt = Date.now() + ttlSeconds * 1000;
      return;
    }
    await this.client!.expire(key, ttlSeconds);
  }

  async keys(pattern: string): Promise<string[]> {
    if (this.useMemory) {
      const regex = new RegExp(`^${pattern.replace(/\*/g, '.*')}$`);
      return [...this.memory.keys()].filter(k => regex.test(k));
    }
    return this.client!.keys(pattern);
  }

  async onModuleDestroy() {
    if (this.client) await this.client.quit();
  }
}
