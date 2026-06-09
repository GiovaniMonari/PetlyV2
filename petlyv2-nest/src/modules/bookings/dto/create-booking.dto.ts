import {
  IsString,
  IsDateString,
  IsNumber,
  IsOptional,
  Min,
  Max,
  IsArray,
  IsIn,
} from 'class-validator';

export class CreateBookingDto {
  @IsString()
  caregiverId!: string;

  @IsDateString()
  startDate!: string;

  @IsDateString()
  endDate!: string;

  @IsString()
  @IsOptional()
  startTime?: string;

  @IsString()
  @IsOptional()
  endTime?: string;

  @IsString()
  @IsOptional()
  location?: string;

  @IsString()
  serviceType!: string;

  @IsString()
  petId!: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  @IsIn(['pay_on_service'])
  paymentMethod?: string;
}
