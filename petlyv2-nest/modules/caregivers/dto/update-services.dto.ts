import { IsNumber, IsOptional } from 'class-validator';

export class UpdateServiceDto {
  @IsOptional()
  @IsNumber()
  price?: number;
}