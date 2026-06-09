import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export enum ServiceType {
  WALK = 'walk',
  BOARDING = 'boarding',
  DAYCARE = 'daycare',
  GROOMING = 'grooming',
  TRAINING = 'training',
}

@Schema({ _id: false })
export class Service {
  @Prop({ enum: ServiceType, required: true })
  type!: ServiceType;

  @Prop({ required: true })
  price!: number;

  @Prop()
  name?: string;

  @Prop()
  description?: string;
}

export const ServiceSchema = SchemaFactory.createForClass(Service);