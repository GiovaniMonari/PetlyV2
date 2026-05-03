import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EmailSendService } from './email-send.service';
import { EmailLog, EmailLogSchema } from './schemas/email.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: EmailLog.name, schema: EmailLogSchema }]),
  ],
  providers: [EmailSendService],
  exports: [EmailSendService],
})
export class EmailSendModule {}
