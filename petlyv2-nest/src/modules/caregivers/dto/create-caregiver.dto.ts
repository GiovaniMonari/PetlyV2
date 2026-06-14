import { IsString, IsEmail, IsArray, IsEnum, IsOptional, MinLength, IsNumber } from 'class-validator';
import { ServiceDto } from './service-dto';
import { AvailabilityDto } from './availability.dto';

export enum CaregiverType {
  DOG = 'dog',
  CAT = 'cat',
  BIRD = 'bird',
  OTHER = 'other',
}

export class CreateCaregiverDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  password!: string;

  cpf!: string;

  bio?: string;

  @IsArray()
  @IsString({ each: true })
  specialties?: string[];
  
  @IsArray()
  @IsEnum(CaregiverType, { each: true })
  petTypes?: CaregiverType[];

  petsQuantity?: {
    type: string;
    quantity: number;
    sizes?: string[];
  }[];

  @IsArray()
  @IsOptional()
  services?: ServiceDto[];

  @IsArray()
  @IsOptional()
  availability?: AvailabilityDto[];

  @IsNumber()
  @IsOptional()
  price?: number;

  @IsNumber()
  @IsOptional()
  minPrice?: number;

  @IsNumber()
  @IsOptional()
  maxPrice?: number;

}