import { BadGatewayException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Resend } from 'resend';
import {
  EmailLog,
  EmailLogDocument,
  EmailLogStatus,
  EmailLogType,
} from './schemas/email.schema';

interface SendResetPasswordEmailParams {
  email: string;
  userId: Types.ObjectId;
  userName: string;
  token: string;
}

@Injectable()
export class EmailSendService {
  constructor(
    @InjectModel(EmailLog.name)
    private readonly emailLogModel: Model<EmailLogDocument>,
    private readonly configService: ConfigService,
  ) {}

  async sendResetPasswordEmail(params: SendResetPasswordEmailParams): Promise<void> {
    const resendApiKey = this.configService.get<string>('RESEND_API_KEY');
    if (!resendApiKey) {
      throw new InternalServerErrorException(
        'RESEND_API_KEY nao configurada no backend.',
      );
    }

    const resend = new Resend(resendApiKey);
    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    const resetPath = this.configService.get<string>('RESET_PASSWORD_PATH') || '/reset-password';
    const from = this.configService.get<string>('RESEND_FROM_EMAIL') || 'Petly <onboarding@resend.dev>';

    const baseUrl = frontendUrl.replace(/\/+$/, '');
    const normalizedPath = resetPath.startsWith('/') ? resetPath : `/${resetPath}`;
    const resetUrl = `${baseUrl}${normalizedPath}?token=${encodeURIComponent(params.token)}&email=${encodeURIComponent(params.email)}`;

    const { data, error } = await resend.emails.send({
      from,
      to: [params.email],
      subject: 'Redefinicao de senha - Petly',
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111;">
          <h2>Ola, ${params.userName}!</h2>
          <p>Recebemos um pedido para redefinir sua senha no Petly.</p>
          <p>
            <a href="${resetUrl}" style="display: inline-block; background: #ff6b35; color: #fff; padding: 10px 16px; border-radius: 8px; text-decoration: none;">
              Redefinir senha
            </a>
          </p>
          <p>Se voce nao solicitou esse e-mail, pode ignorar com seguranca.</p>
        </div>
      `,
    });

    if (error) {
      await this.emailLogModel.create({
        email: params.email.toLowerCase(),
        userId: params.userId,
        type: EmailLogType.PASSWORD_RESET,
        provider: 'resend',
        status: EmailLogStatus.FAILED,
        errorMessage: error.message,
        sentAt: new Date(),
      });

      throw new BadGatewayException('Falha ao enviar e-mail de redefinicao.');
    }

    await this.emailLogModel.create({
      email: params.email.toLowerCase(),
      userId: params.userId,
      type: EmailLogType.PASSWORD_RESET,
      provider: 'resend',
      status: EmailLogStatus.SENT,
      providerMessageId: data?.id,
      sentAt: new Date(),
    });
  }
}
