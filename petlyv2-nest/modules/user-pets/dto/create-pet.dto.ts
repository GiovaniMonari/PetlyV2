import { IsString, IsEnum, Min, IsOptional } from 'class-validator';
import { PetType, PetSize } from '../schemas/pets.schema';

export class CreatePetDto {
  @IsString()
  name!: string;

  @IsString()
  @IsOptional()
  avatar?: string;

  @IsEnum(PetType)
  type!: PetType;

  @IsEnum(PetSize)
  size!: PetSize;

  @Min(0)
  age!: number;

  @IsString()
  breed!: string;

  @IsString()
  @IsOptional()
  notes?: string;
}