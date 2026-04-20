import { IsString, IsEmail, IsArray, IsEnum } from 'class-validator';

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
  password!: string;

  @IsString()
  location!: string;

  @IsString()
  bio!: string;

  @IsArray()
  @IsEnum(CaregiverType, { each: true })
  types!: CaregiverType[];
}