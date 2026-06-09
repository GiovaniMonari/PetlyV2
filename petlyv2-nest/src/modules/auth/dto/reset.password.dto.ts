import { IsString } from 'class-validator';

export class ResetPasswordDto {
  @IsString()
  readonly message!: string;
}
