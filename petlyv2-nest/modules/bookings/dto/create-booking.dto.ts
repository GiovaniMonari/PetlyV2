import {
  IsString,
  IsDateString,
  IsNumber,
  IsOptional,
  Min,
  Max,
} from 'class-validator';

export class CreateBookingDto {
  @IsString()
  caregiverId!: string;

  @IsDateString()
  startDate!: string;

  @IsDateString()
  endDate!: string;

  @IsString()
  serviceType!: string;

  @IsNumber()
  @Min(1)
  petsCount!: number;

  @IsString()
  petType!: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
