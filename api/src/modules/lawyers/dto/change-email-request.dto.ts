import { IsEmail, IsNotEmpty } from 'class-validator';

export class ChangeEmailRequestDto {
  @IsNotEmpty({ message: 'VAL0021' })
  @IsEmail({}, { message: 'VAL0022' })
  newEmail: string;
}
