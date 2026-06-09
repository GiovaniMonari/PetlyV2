import {
  IsString,
  IsEmail,
  IsEnum,
  IsOptional,
  MinLength,
  IsArray,
  IsNumber,
} from 'class-validator';

export enum UserRole {
  TUTOR = 'tutor',
  CAREGIVER = 'caregiver',
}

export class CreateUserDto {
  @IsString()
  name!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  password!: string;

  @IsEnum(UserRole)
  role!: UserRole;

  // Caregiver-only fields
  @IsOptional()
  @IsString()
  cpf?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  specialties?: string[];

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  petTypes?: string[];

  @IsOptional()
  @IsNumber()
  price?: number;
}
