import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type BookingDocument = Booking & Document;

export enum BookingStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  IN_PROGRESS = 'in_progress',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
}

@Schema()
export class BookingReview {
  @Prop({ required: true, min: 1, max: 5 })
  rating!: number;

  @Prop()
  comment?: string;

  @Prop({ default: Date.now })
  createdAt!: Date;
}

export const BookingReviewSchema =
  SchemaFactory.createForClass(BookingReview);

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

  @Prop()
  location?: string;

  @Prop({ required: true, default: 'hospedagem' })
  serviceType!: string;

  @Prop({ type: Types.ObjectId, ref: 'Pet', required: true })
  petId!: Types.ObjectId;

  @Prop()
  startTime?: string;

  @Prop()
  endTime?: string;

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

  @Prop({ enum: ['pay_on_service'], default: 'pay_on_service' })
  paymentMethod?: string;

  @Prop({ type: BookingReviewSchema })
  review?: BookingReview;
}

export const BookingSchema = SchemaFactory.createForClass(Booking);
