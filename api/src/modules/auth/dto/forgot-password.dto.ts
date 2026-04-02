import { IsEmail, IsNotEmpty } from 'class-validator';

export class ForgotPasswordDto {
  @IsNotEmpty({ message: 'VAL0021' })
  @IsEmail({}, { message: 'VAL0022' })
  email: string;
}
