import { Injectable } from '@nestjs/common';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';

@Injectable()
export class CacheService {
  constructor(
    @InjectRedis()
    private readonly redis: Redis,
  ) {}

  async get<T>(key: string): Promise<T | null> {
    const data = await this.redis.get(key);

    if (!data) {
      return null;
    }

    return JSON.parse(data) as T;
  }

  async set(
    key: string,
    value: unknown,
    ttl = 300,
  ): Promise<void> {
    await this.redis.set(
      key,
      JSON.stringify(value),
      'EX',
      ttl,
    );
  }

  async del(key: string): Promise<void> {
    await this.redis.del(key);
  }
}