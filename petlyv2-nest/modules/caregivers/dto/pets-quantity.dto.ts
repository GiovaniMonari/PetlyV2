import { IsEnum, IsNumber, IsOptional, IsString } from "class-validator";
import { CaregiverType } from "./create-caregiver.dto";

export class PetsQuantityDto {
  @IsOptional()
  @IsString()
  _id?: string;

  @IsEnum(CaregiverType)
  type!: CaregiverType;

  @IsNumber()
  quantity!: number;
}[]