import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Booking, BookingSchema } from './schemas/booking.schema';
import { BookingsService } from './bookings.service';
import { BookingsController } from './bookings.controller';
import { CaregiversModule } from '@modules/caregivers/caregivers.module';
import { UsersModule } from '@modules/users/users.module';
import { RedisService } from 'src/redis/redis.service';
import { QueueModule } from './queues/bookings.queue.module';
import { BookingsWorker } from './queues/bookings.worker';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Booking.name, schema: BookingSchema }]),
    CaregiversModule,
    UsersModule,
    QueueModule,
  ],
  controllers: [BookingsController],
  providers: [BookingsService, BookingsWorker, RedisService],
  exports: [BookingsService],
})
export class BookingsModule {}
