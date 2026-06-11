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
        <div style="font-family: Arial, sans-serif; background:#f6f7fb; padding:40px 0;">
          <div style="max-width:520px; margin:0 auto; background:#ffffff; border-radius:12px; padding:32px; box-shadow:0 4px 12px rgba(0,0,0,0.06);">

            <h2 style="color:#111827; margin-bottom:16px;">
              Olá, ${params.userName}
            </h2>

            <p style="color:#4b5563; font-size:15px; line-height:1.6;">
              Recebemos uma solicitação para redefinir a senha da sua conta no <strong>Petly</strong>.
              Se foi você, clique no botão abaixo para criar uma nova senha com segurança.
            </p>

            <div style="text-align:center; margin:32px 0;">
              <a href="${resetUrl}"
                style="
                  background:#f97316;
                  color:#ffffff;
                  padding:12px 20px;
                  border-radius:8px;
                  text-decoration:none;
                  font-weight:600;
                  display:inline-block;
                ">
                Redefinir minha senha
              </a>
            </div>

            <p style="color:#6b7280; font-size:13px; line-height:1.5;">
              Se você não solicitou isso, pode ignorar este e-mail com segurança.
              Nenhuma ação será tomada na sua conta.
            </p>

            <hr style="border:none; border-top:1px solid #e5e7eb; margin:24px 0;" />

            <p style="color:#9ca3af; font-size:12px; text-align:center;">
              © ${new Date().getFullYear()} Petly. Projeto desenvolvido por Giovani Taver Monari.
            </p>

          </div>
        </div>
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