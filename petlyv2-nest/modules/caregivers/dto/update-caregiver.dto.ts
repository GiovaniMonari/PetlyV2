import { PartialType } from '@nestjs/mapped-types';
import { CreateCaregiverDto, CaregiverType } from './create-caregiver.dto';
import { IsOptional, IsArray, ValidateNested, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { ServiceDto } from './service-dto';

export class UpdateCaregiverDto extends PartialType(CreateCaregiverDto) {
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ServiceDto)
  services?: ServiceDto[];

  @IsOptional()
  @IsArray()
  @IsEnum(CaregiverType, { each: true })
  types?: CaregiverType[];
}