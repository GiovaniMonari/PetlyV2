import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CaregiverProfile, CaregiverProfileSchema } from './schemas/caregiver.schema';
import { Booking, BookingSchema } from '@modules/bookings/schemas/booking.schema';
import { CaregiversService } from './caregivers.service';
import { CaregiversController } from './caregivers.controller';
import { User, UserSchema } from '@modules/users/schemas/user.schema';
import { CaregiverAssembler } from './asssembler/caregiver.assembler';
import { RedisModule } from 'src/redis/redis.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CaregiverProfile.name, schema: CaregiverProfileSchema,},
      { name: Booking.name, schema: BookingSchema },
      { name:User.name, schema: UserSchema },
    ]),
    RedisModule,
  ],
  controllers: [CaregiversController],
  providers: [CaregiversService, CaregiverAssembler],
  exports: [CaregiversService],
})
export class CaregiversModule {}
