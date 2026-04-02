import { IsString, IsEmail, IsNotEmpty, Length } from 'class-validator';

export class LoginUserDto {
  @IsNotEmpty({ message: 'VAL0021' })
  @IsEmail({}, { message: 'VAL0022' })
  email: string;

  @IsNotEmpty({ message: 'VAL0031' })
  @IsString({ message: 'VAL0032' })
  @Length(8, 100, { message: 'VAL0033' })
  password: string;
}
