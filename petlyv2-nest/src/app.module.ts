import { AuthModule } from 'src/modules/auth/auth.module';
import { BookingsModule } from 'src/modules/bookings/bookings.module';
import { CaregiversModule } from 'src/modules/caregivers/caregivers.module';
import { UserPetsModule } from 'src/modules/user-pets/user-pets.module';
import { UsersModule } from 'src/modules/users/users.module';
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