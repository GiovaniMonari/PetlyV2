import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types, Schema as MongooseSchema } from 'mongoose';
import { User } from '../../users/schemas/user.schema';
import { ServiceType } from '../dto/service-dto';

export type CaregiverProfileDocument =
  CaregiverProfile & Document;

const PetsQuantitySchema = new MongooseSchema(
  {
    type: String,
    quantity: Number,
    sizes: [String],
  },
  { _id: false },
);

@Schema({ timestamps: true })
export class CaregiverProfile {
  @Prop({
    type: Types.ObjectId,
    ref: User.name,
    required: true,
    unique: true,
  })
  userId!: Types.ObjectId;

  @Prop()
  cpf?: string;

  @Prop()
  bio?: string;

  @Prop({ type: [String], default: [] })
  specialties!: string[];

  @Prop({ type: [String], default: [] })
  petTypes!: string[];

  @Prop({
    type: [PetsQuantitySchema],
    default: [],
  })
  petsQuantity!: {
    type: string;
    quantity: number;
    sizes?: string[];
  }[];

  @Prop({
    default: 0,
  })
  price!: number;

  @Prop({
    default: 0,
  })
  minPrice!: number;

  @Prop({
    default: 0,
  })
  maxPrice!: number;

  @Prop({
    type: [
      {
        type: {
          type: String,
          enum: Object.values(ServiceType),
          required: true,
        },
        price: {
          type: Number,
          required: true,
        },
        name: String,
        description: String,
        duration: String,
      },
    ],
    default: [],
  })
  services!: {
    type: ServiceType;
    name: string;
    price: number;
    duration: string;
  }[];

  @Prop({
    type: [
      {
        service: {
          type: String,
          enum: Object.values(ServiceType),
        },
        availableDays: [String],
        serviceHours: [String],
      },
    ],
    default: [],
  })
  availability!: {
    service: ServiceType;
    availableDays: string[];
    serviceHours: string[];
  }[];

  @Prop({ type: [String], default: [] })
  blockedDates!: string[];

  @Prop({ type: [String], default: [] })
  blockedTimeSlots!: string[];

  @Prop({ default: 0 })
  rating!: number;

  @Prop({ default: 0 })
  reviewsCount!: number;
}

export const CaregiverProfileSchema =
  SchemaFactory.createForClass(
    CaregiverProfile,
  );

CaregiverProfileSchema.index({
  minPrice: 1,
});

CaregiverProfileSchema.index({
  rating: -1,
});

CaregiverProfileSchema.index({
  specialties: 1,
});

CaregiverProfileSchema.index({
  rating: -1,
  minPrice: 1,
});
