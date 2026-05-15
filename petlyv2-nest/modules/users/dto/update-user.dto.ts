import { PartialType } from '@nestjs/mapped-types';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { CreateUserDto } from './create-user.dto';
import { PetSize, PetType } from '@modules/user-pets/schemas/pets.schema';

class ServiceItemDto {
  @IsOptional()
  @IsString()
  _id?: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsString()
  name!: string;

  @IsNumber()
  price!: number;

  @IsString()
  duration!: string;
}

class PetsQuantityItemDto {
  @IsOptional()
  @IsString()
  _id?: string;

  @IsString()
  type!: string;

  @IsNumber()
  quantity!: number;
}

class MyPetsItemDto {
  @IsOptional()
  @IsString()
  _id?: string;

  @IsString()
  name!: string;

  @IsEnum(PetType)
  type!: PetType;

  @IsEnum(PetSize)
  size!: PetSize;

  @IsNumber()
  age!: number;

  @IsString()
  breed!: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ServiceItemDto)
  services?: ServiceItemDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PetsQuantityItemDto)
  petQuantities?: PetsQuantityItemDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MyPetsItemDto)
  myPets?: MyPetsItemDto[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  availableDays?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  serviceHours?: string[];

  @IsOptional()
  @IsArray()
  availability?: any[];
}
