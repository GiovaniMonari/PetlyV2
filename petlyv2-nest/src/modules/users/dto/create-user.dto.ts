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

  @IsOptional()
  @IsString()
  location?: string;

  @IsEnum(UserRole)
  role!: UserRole;
}
