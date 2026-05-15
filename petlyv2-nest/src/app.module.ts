import { AuthModule } from '@modules/auth/auth.module';
import { BookingsModule } from '@modules/bookings/bookings.module';
import { CaregiversModule } from '@modules/caregivers/caregivers.module';
import { UserPetsModule } from '@modules/user-pets/user-pets.module';
import { UsersModule } from '@modules/users/users.module';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI'),
      }),
    }),
    AuthModule,
    UsersModule,
    CaregiversModule,
    BookingsModule,
    UserPetsModule,
  ],
})
export class AppModule {}