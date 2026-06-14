import { Worker } from 'bullmq';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { BookingsService } from '../bookings.service';
import IORedis from 'ioredis';

@Injectable()
export class BookingsWorker implements OnModuleInit {
  constructor(private readonly bookingsService: BookingsService) {}

  onModuleInit() {
    const connection = new IORedis(process.env.REDIS_URL, {
      maxRetriesPerRequest: null,
    });
    new Worker(
      'bookings',
      async (job) => {
        const { tutorId, dto } = job.data;

        return this.bookingsService.createDirect(tutorId, dto);
      },
      {
        connection,
        concurrency: 5,
      },
    );
  }
}