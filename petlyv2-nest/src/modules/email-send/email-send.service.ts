import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Types } from 'mongoose';

interface SendResetPasswordEmailParams {
  email: string;
  userId: Types.ObjectId;
  userName: string;
  token: string;
}

@Injectable()
export class EmailService {
  constructor(
    @InjectQueue('email-queue')
    private readonly emailQueue: Queue,
  ) {}

  async sendResetPasswordEmailJob(params: SendResetPasswordEmailParams) {
    await this.emailQueue.add('send-reset-password', params, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000,
      },
    });
  }
}