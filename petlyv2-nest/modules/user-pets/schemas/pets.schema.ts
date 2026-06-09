import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PetDocument = Pet & Document;

export enum PetType {
  DOG = 'dog',
  CAT = 'cat',
  BIRD = 'bird',
  OTHER = 'other',
}

export enum PetSize {
  SMALL = 'small',
  MEDIUM = 'medium',
  LARGE = 'large',
}

@Schema({ timestamps: true })
export class Pet {
  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  name: string;

  @Prop()
  avatar?: string;

  @Prop({ required: true })
  type: PetType;

  @Prop({ required: true })
  size: string;

  @Prop({ required: true })
  age: number;

  @Prop({ required: true })
  breed: string;

  @Prop()
  notes?: string;
}

export const PetSchema = SchemaFactory.createForClass(Pet);
