import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ServiceType } from '../../caregivers/dto/service-dto';

export type UserDocument = User & Document;

export enum UserRole {
  TUTOR = 'tutor',
  CAREGIVER = 'caregiver',
}

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true })
  name!: string;

  @Prop({ required: true, unique: true })
  email!: string;

  @Prop({ required: true })
  password!: string;

  @Prop({ enum: UserRole, required: true, default: UserRole.TUTOR })
  role!: UserRole;

  // Caregiver-specific fields (populated when role === 'caregiver')
  @Prop()
  cpf?: string;

  @Prop()
  location?: string;

  @Prop({ type: [String], default: [] })
  specialties?: string[];

  @Prop()
  bio?: string;

  @Prop()
  avatar?: string;

  @Prop({ type: [String], enum: ['dog', 'cat', 'bird', 'other'], default: [] })
  petTypes?: string[];

  @Prop({ type: [{ type: { type: String }, quantity: Number }], default: [] })
  petsQuantity?: { type: string; quantity: number }[];

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Pet' }], default: [] })
  pets?: Types.ObjectId[];

  @Prop({default: 0 })
  price?: number;

  @Prop({ default: 0 })
  minPrice?: number;

  @Prop({ default: 0 })
  maxPrice?: number;

  @Prop({ type: [{ 
    type: { type: String, enum: Object.values(ServiceType) },
    name: String, 
    price: Number, 
    duration: String 
  }], default: [] })
  services?: { type: ServiceType; name: string; price: number; duration: string }[];

  @Prop({ type: [String], default: [] })
  availableDays?: string[];

  @Prop({ type: [String], default: [] })
  serviceHours?: string[];  

  @Prop({ type: [{ service: String, availableDays: [String], serviceHours: [String] }], default: [] })
  availability?: { service: ServiceType, availableDays: string[], serviceHours: string[] }[];

  @Prop({ default: 0 })
  rating?: number;

  @Prop({ default: 0 })
  reviewsCount?: number;

  @Prop({ default: true })
  isActive?: boolean;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'tutor' }], default: [] })
  favorites?: Types.ObjectId[];
}

export const UserSchema = SchemaFactory.createForClass(User);
