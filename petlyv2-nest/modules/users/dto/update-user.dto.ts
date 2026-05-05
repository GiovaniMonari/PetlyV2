import { PartialType } from '@nestjs/mapped-types';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { CreateUserDto } from './create-user.dto';

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
