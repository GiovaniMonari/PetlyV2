import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types, Schema as MongooseSchema } from 'mongoose';
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
  avatar!: string;

  @Prop({ required: true })
  password!: string;

  @Prop()
  location?: string;

  @Prop({ enum: UserRole, required: true, default: UserRole.TUTOR })
  role!: UserRole;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Pet' }], default: [] })
  myPets?: Types.ObjectId[];

  @Prop({ default: true })
  isActive?: boolean;

  @Prop({ type: [{ type: Types.ObjectId, ref: User.name }], default: [] })
  favorites?: Types.ObjectId[];
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.index({
  role: 1,
  isActive: 1,
});

UserSchema.index({
  role: 1,
  isActive: 1,
  createdAt: -1,
});