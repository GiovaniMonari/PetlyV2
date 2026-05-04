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
  @IsInt({ each: true })
  @Min(0, { each: true })
  @Max(6, { each: true })
  availableDays?: number[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PetsQuantityItemDto)
  petQuantities?: PetsQuantityItemDto[];
}
