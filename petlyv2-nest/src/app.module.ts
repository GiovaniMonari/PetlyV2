import { AuthModule } from 'src/modules/auth/auth.module';
import { BookingsModule } from 'src/modules/bookings/bookings.module';
import { CaregiversModule } from 'src/modules/caregivers/caregivers.module';
import { UserPetsModule } from 'src/modules/user-pets/user-pets.module';
import { UsersModule } from 'src/modules/users/users.module';
import { Module } from '@nestjs/common';
import { RedisModule } from '@nestjs-modules/ioredis'
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { BullModule } from '@nestjs/bullmq/dist/bull.module';
import { BullBoardModule } from '@bull-board/nestjs';
import { ExpressAdapter } from '@bull-board/express';
import { EmailModule } from '@modules/email-send/email-send.module';
import { CacheModule } from '@modules/cache/cache.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    RedisModule.forRoot({
      type:'single',
      url: process.env.REDIS_URL,
    }),

    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI'),
      }),
    }),

    BullModule.forRoot({
      connection: {
        url: process.env.REDIS_URL,
      },
    }),

    BullBoardModule.forRoot({
      route: '/queues',
      adapter: ExpressAdapter,
    }),

    CacheModule,
    EmailModule,
    AuthModule,
    UsersModule,
    CaregiversModule,
    BookingsModule,
    UserPetsModule,
  ],
})
export class AppModule {}