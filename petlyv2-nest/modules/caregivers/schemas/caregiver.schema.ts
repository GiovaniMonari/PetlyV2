import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Service, ServiceSchema, ServiceType } from './services.schema';
import { PetsQuantityDto } from '../dto/pets-quantity.dto';

export type CaregiverDocument = Caregiver & Document;

export enum CaregiverType {
  DOG = 'dog',
  CAT = 'cat',
  BIRD = 'bird',
  OTHER = 'other',
}

@Schema({ timestamps: true })
export class Caregiver {
  @Prop({ required: true })
  name!: string;

  @Prop({ required: true, unique: true })
  email!: string;

  @Prop({ required: true })
  password!: string;

  @Prop({ unique: true, sparse: true })
  cpf?: string;

  @Prop({ required: true })
  location!: string;

  @Prop({ type: [String], default: [] })
  specialties!: string[];

  @Prop()
  bio!: string;

  @Prop()
  avatar?: string;

  @Prop({ enum: CaregiverType, required: true })
  type!: CaregiverType;

  @Prop({ type: PetsQuantityDto, default: [] })
  petsQuantity!: { type: string, quantity: number }[];

  @Prop({ default: 0 })
  price!: number;

  @Prop({ default: 0 })
  rating!: number;

  @Prop({ default: 0 })
  reviewsCount!: number;

  @Prop({ type: [ServiceSchema], default: [] })
  services!: Service[];

  @Prop({ type: [{ service: String, availableDays: [String], serviceHours: [String] }], default: [] })
  availability!: { service: ServiceType, availableDays: string[], serviceHours: string[] }[];

  @Prop({ default: true })
  isActive!: boolean;
}

export const CaregiverSchema = SchemaFactory.createForClass(Caregiver);