import { PartialType } from '@nestjs/mapped-types';
import { CreateCaregiverDto, CaregiverType } from './create-caregiver.dto';
import { IsOptional, IsArray, ValidateNested, IsEnum, IsString, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { ServiceDto } from './service-dto';
import { PetsQuantityDto } from './pets-quantity.dto';
import { AvailabilityDto } from './availability.dto';

export class UpdateCaregiverDto extends PartialType(CreateCaregiverDto) {
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ServiceDto)
  services?: ServiceDto[];

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsArray()
  @IsEnum(CaregiverType, { each: true })
  types?: CaregiverType[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PetsQuantityDto)
  petQuantities?: PetsQuantityDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AvailabilityDto)
  availability?: AvailabilityDto[];
}