import { Worker } from 'bullmq';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { BookingsService } from '../bookings.service';
import IORedis from 'ioredis';

@Injectable()
export class BookingsWorker implements OnModuleInit {
  private worker: Worker;

  constructor(private readonly bookingsService: BookingsService) {}

  onModuleInit() {
    if (this.worker) return;

    const connection = new IORedis(process.env.REDIS_URL, {
      maxRetriesPerRequest: null,
      enableReadyCheck: true,
    });

    connection.on('connect', () => console.log('Redis connected'));
    connection.on('error', (err) => console.error('Redis error', err));

    this.worker = new Worker(
      'bookings',
      async (job) => {
        try {
          console.log('🔥 Worker received job:', job.id);

          const { tutorId, dto } = job.data;

          const result = await this.bookingsService.createDirect(
            tutorId,
            dto,
          );

          console.log('✅ Booking saved:', result._id);

          return result;
        } catch (err) {
          console.error('❌ Worker error:', err);
          throw err;
        }
      },
      {
        connection,
        concurrency: 5,
      },
    );
  }
}