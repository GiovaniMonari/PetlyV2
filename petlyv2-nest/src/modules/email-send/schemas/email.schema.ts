import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaTypes, Types } from 'mongoose';

export type EmailLogDocument = EmailLog & Document;

export enum EmailLogType {
  PASSWORD_RESET = 'password_reset',
}

export enum EmailLogStatus {
  SENT = 'sent',
  FAILED = 'failed',
}

@Schema({ timestamps: true })
export class EmailLog {
  @Prop({ required: true, lowercase: true, trim: true, index: true })
  email!: string;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'User', index: true })
  userId?: Types.ObjectId;

  @Prop({
    required: true,
    enum: EmailLogType,
    default: EmailLogType.PASSWORD_RESET,
  })
  type!: EmailLogType;

  @Prop({ required: true, default: 'resend' })
  provider!: string;

  @Prop({ required: true, enum: EmailLogStatus })
  status!: EmailLogStatus;

  @Prop()
  providerMessageId?: string;

  @Prop()
  errorMessage?: string;

  @Prop({ required: true, default: Date.now })
  sentAt!: Date;
}

export const EmailLogSchema = SchemaFactory.createForClass(EmailLog);
