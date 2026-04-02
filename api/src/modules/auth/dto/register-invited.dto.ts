import { IsString, MinLength, IsNotEmpty } from 'class-validator';

export class RegisterInvitedDto {
  @IsString()
  @IsNotEmpty()
  token: string;

  @IsString()
  @MinLength(2)
  name: string;

  @IsString()
  @MinLength(6)
  password: string;
}
