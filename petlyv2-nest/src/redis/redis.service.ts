import { Injectable } from '@nestjs/common';
import { InjectRedis } from '@nestjs-modules/ioredis';
import type Redis from 'ioredis';

@Injectable()
export class RedisService {
  constructor(
    @InjectRedis()
    private readonly redis: Redis,
  ) {}

  async set(key: string, value: string, ttl?: number) {
    if (ttl) {
      return this.redis.set(key, value, 'PX', ttl);
    }
    return this.redis.set(key, value);
  }

  async get<T = string>(key: string): Promise<T | null> {
    const value = await this.redis.get(key);
    if (!value) return null;

    try {
      return JSON.parse(value) as T;
    } catch {
      return value as unknown as T;
    }
  }

  async del(key: string) {
    return this.redis.del(key);
  }

  async delPattern(pattern: string): Promise<void> {
    const stream = this.redis.scanStream({
      match: pattern,
      count: 100,
    });

    return new Promise((resolve, reject) => {
      const pipeline = this.redis.pipeline();
      let keysFound = false;

      stream.on('data', (keys) => {
        if (keys.length) {
          keysFound = true;
          keys.forEach(key => pipeline.del(key));
        }
      });

      stream.on('end', () => {
        if (keysFound) {
          pipeline.exec((err) => {
            if (err) reject(err);
            else resolve();
          });
        } else {
          resolve();
        }
      });

      stream.on('error', (err) => reject(err));
    });
  }

  async acquireLock(key: string, ttl = 10000): Promise<boolean> {
    const result = await this.redis.set(key, 'locked', 'PX', ttl, 'NX');
    return result === 'OK';
  }

  async releaseLock(key: string): Promise<void> {
    await this.redis.del(key);
  }

  async exists(key: string): Promise<boolean> {
    return (await this.redis.exists(key)) === 1;
  }

  async expire(key: string, ttl: number): Promise<void> {
    await this.redis.pexpire(key, ttl);
  }
}