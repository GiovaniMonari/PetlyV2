import { IsString, IsNotEmpty } from 'class-validator';

export class FavoriteCaregiverDto {
  @IsString()
  @IsNotEmpty()
  caregiverId: string;
}