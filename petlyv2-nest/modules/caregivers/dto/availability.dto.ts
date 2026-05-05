import { IsArray, IsEnum, IsNumber, IsString } from "class-validator";
import { ServiceType } from "./service-dto";

export class AvailabilityDto {
    @IsArray()
    @IsString({ each: true })
    availableDays: string[];

    @IsArray()
    @IsEnum(ServiceType, { each: true })
    service: ServiceType;

    @IsArray()
    @IsString({ each: true })
    serviceHours: string[];
}   