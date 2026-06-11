// src/redis/redis.module.ts
import { Module } from '@nestjs/common';
import { RedisModule as NestRedisModule } from '@nestjs-modules/ioredis';

@Module({
  imports: [
    NestRedisModule.forRoot({
      type: 'single',
      url: process.env.REDIS_URL,
    }),
  ],
  exports: [NestRedisModule],
})
export class RedisModule {}