import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type BookingDocument = Booking & Document;

export enum BookingStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
}

export class BookingReview {
  @Prop({ required: true, min: 1, max: 5 })
  rating!: number;

  @Prop()
  comment?: string;

  @Prop({ default: Date.now })
  createdAt!: Date;
}

@Schema({ timestamps: true })
export class Booking {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  tutorId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  caregiverId!: Types.ObjectId;

  @Prop({ required: true })
  startDate!: Date;

  @Prop({ required: true })
  endDate!: Date;

  @Prop({ required: true, default: 'hospedagem' })
  serviceType!: string;

  @Prop({ required: true, default: 1 })
  petsCount!: number;

  @Prop({ required: true })
  totalDays!: number;

  @Prop({ required: true })
  pricePerDay!: number;

  @Prop({ required: true })
  totalPrice!: number;

  @Prop({ enum: BookingStatus, default: BookingStatus.PENDING })
  status!: BookingStatus;

  @Prop()
  notes?: string;

  @Prop({
    type: {
      rating: Number,
      comment: String,
      createdAt: Date,
    },
  })
  review?: BookingReview;
}

export const BookingSchema = SchemaFactory.createForClass(Booking);
