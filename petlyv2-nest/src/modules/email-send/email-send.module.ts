import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BullModule } from '@nestjs/bullmq';

import { EmailProcessor } from './email-send.processor';
import { EmailService } from './email-send.service';
import { EmailLog, EmailLogSchema } from './schemas/email.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: EmailLog.name, schema: EmailLogSchema },
    ]),

    BullModule.registerQueue({
      name: 'email-queue',
    }),
  ],

  providers: [
    EmailService,
    EmailProcessor,
  ],

  exports: [
    EmailService, 
  ],
})
export class EmailModule {}