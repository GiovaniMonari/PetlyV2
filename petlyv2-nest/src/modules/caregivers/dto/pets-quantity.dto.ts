import { IsArray, IsEnum, IsNumber, IsOptional, IsString } from "class-validator";
import { CaregiverType } from "./create-caregiver.dto";
import { PetSize } from "src/modules/user-pets/schemas/pets.schema";

export class PetsQuantityDto {
  @IsOptional()
  @IsString()
  _id?: string;

  @IsEnum(CaregiverType)
  type!: CaregiverType;

  @IsNumber()
  quantity!: number;

  @IsOptional()
  @IsArray()
  @IsEnum(PetSize, { each: true })
  sizes?: PetSize[];
}