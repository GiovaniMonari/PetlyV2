import { IsString, IsEmail, IsArray, IsEnum, IsOptional, MinLength, IsNumber } from 'class-validator';

export enum CaregiverType {
  DOG = 'dog',
  CAT = 'cat',
  BIRD = 'bird',
  OTHER = 'other',
}

export class CreateCaregiverDto {
  @IsString()
  name!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  password!: string;

  @IsOptional()
  @IsString()
  cpf?: string;

  @IsString()
  location!: string;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  specialties?: string[];

  @IsEnum(CaregiverType)
  type!: CaregiverType;

  @IsOptional()
  @IsNumber()
  price?: number;
}