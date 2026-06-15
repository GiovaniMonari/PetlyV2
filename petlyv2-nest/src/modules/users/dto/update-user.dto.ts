import { PartialType } from '@nestjs/mapped-types';
import { Type } from 'class-transformer';
import {
  isArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { CreateUserDto } from './create-user.dto';
import { PetSize, PetType } from 'src/modules/user-pets/schemas/pets.schema';
import { CreateBookingDto } from '@modules/bookings/dto/create-booking.dto';

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
  myPets?: MyPetsItemDto[];

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreateBookingDto)
  bookings?: CreateBookingDto[];
}
