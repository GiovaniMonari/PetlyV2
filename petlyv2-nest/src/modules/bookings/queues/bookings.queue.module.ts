// src/queue/queue.module.ts
import { Module } from '@nestjs/common';
import { Queue } from 'bullmq';
import IORedis from 'ioredis';

export const BOOKINGS_QUEUE = 'bookings';

@Module({
  providers: [
    {
      provide: BOOKINGS_QUEUE,
      useFactory: () => {
        const connection = new IORedis(process.env.REDIS_URL);

        return new Queue(BOOKINGS_QUEUE, {
          connection,
        });
      },
    },
  ],
  exports: [BOOKINGS_QUEUE],
})
export class QueueModule {}