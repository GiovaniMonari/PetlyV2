import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

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

  @Prop({ default: 0 })
  price?: number;

  @Prop({ type: [{ name: String, price: Number, duration: String }], default: [] })
  services?: { name: string; price: number; duration: string }[];

  @Prop({ type: [Number], default: [0, 1, 2, 3, 4, 5, 6] }) // 0 = Sunday, 1 = Monday, etc.
  availableDays?: number[];

  @Prop({ default: 0 })
  rating?: number;

  @Prop({ default: 0 })
  reviewsCount?: number;

  @Prop({ default: true })
  isActive?: boolean;
}

export const UserSchema = SchemaFactory.createForClass(User);
