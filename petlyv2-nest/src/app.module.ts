import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../modules/auth/auth.module';
import { UsersModule } from '../modules/users/users.module';
import { CaregiversModule } from '../modules/caregivers/caregivers.module';
import { BookingsModule } from '../modules/bookings/bookings.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    MongooseModule.forRoot(
      process.env.MONGODB_URI || 'mongodb://localhost:27017/petlyv2',
    ),
    AuthModule,
    UsersModule,
    CaregiversModule,
    BookingsModule,
  ],
})
export class AppModule {}
