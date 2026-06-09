import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { PetSize, PetType } from '../schemas/pets.schema';

export class UpdatePetDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  avatar?: string;

  @IsEnum(PetType)
  @IsOptional()
  type?: PetType;

  @IsEnum(PetSize)
  @IsOptional()
  size?: PetSize;

  @IsNumber()
  @IsOptional()
  age?: number;

  @IsString()
  @IsOptional()
  breed?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}