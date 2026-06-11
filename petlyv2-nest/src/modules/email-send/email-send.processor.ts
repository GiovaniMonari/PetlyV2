import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Resend } from 'resend';
import { ConfigService } from '@nestjs/config';
import { EmailLog, EmailLogDocument } from './schemas/email.schema';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose/dist/common/mongoose.decorators';

@Processor('email-queue')
export class EmailProcessor extends WorkerHost {
  constructor(
    private configService: ConfigService,

    @InjectModel(EmailLog.name)
    private emailLogModel: Model<EmailLogDocument>,
  ) {
    super();
  }

  async process(job: Job<any>) {
    if (job.name === 'send-reset-password') {
      return this.handleReset(job.data);
    }
  }

  private async handleReset(params: any) {
    const resend = new Resend(
      this.configService.get('RESEND_API_KEY'),
    );

    const frontendUrl = this.configService.get('FRONTEND_URL');
    const resetPath = this.configService.get('RESET_PASSWORD_PATH') || '/reset-password';

    const baseUrl = frontendUrl.replace(/\/+$/, '');
    const normalizedPath = resetPath.startsWith('/') ? resetPath : `/${resetPath}`;

    const resetUrl = `${baseUrl}${normalizedPath}?token=${encodeURIComponent(params.token)}&email=${encodeURIComponent(params.email)}`;

    const { error } = await resend.emails.send({
      from: 'Petly <onboarding@resend.dev>',
      to: [params.email],
      subject: 'Redefinição de senha - Petly',
      html: `
        <h2>Olá ${params.userName}</h2>
        <a href="${resetUrl}">Redefinir senha</a>
      `,
    });

    await this.emailLogModel.create({
      email: params.email.toLowerCase(),
      userId: params.userId,
      type: 'password_reset',
      provider: 'resend',
      status: error ? 'failed' : 'sent',
      errorMessage: error?.message,
    });

    if (error) {
      throw new Error('Falha ao enviar e-mail');
    }
  }
}