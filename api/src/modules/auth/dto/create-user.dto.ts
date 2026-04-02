import { IsString, IsEmail, IsEnum, IsNotEmpty, IsOptional, Matches, Length, MaxLength } from 'class-validator';
import { ValidRoles } from 'src/modules/auth/interfaces/validRoles';

export class CreateUserDto {
  @IsNotEmpty({ message: 'VAL0011' })
  @IsString({ message: 'VAL0012' })
  @Length(3, 100, { message: 'VAL0013' })
  @Matches(/^[\p{L}\s'-]+$/u, { message: 'VAL0015' })
  name: string;

  @IsNotEmpty({ message: 'VAL0021' })
  @IsEmail({}, { message: 'VAL0022' })
  email: string;

  @IsNotEmpty({ message: 'VAL0031' })
  @IsString({ message: 'VAL0032' })
  @Length(8, 100, { message: 'VAL0033' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_+\-=\[\]{};':"\\|,.<>\/])[A-Za-z\d@$!%*?&#^()_+\-=\[\]{};':"\\|,.<>\/]{8,}$/, { message: 'VAL0034' })
  password: string;

  @IsOptional()
  @IsString({ message: 'VAL0061' })
  @MaxLength(100, { message: 'VAL0061' })
  @Matches(/^[\p{L}\s'-]+$/u, { message: 'VAL0061' })
  country?: string;

  @IsOptional()
  @IsString({ message: 'VAL0071' })
  @MaxLength(100, { message: 'VAL0071' })
  @Matches(/^[\w\/]+$/, { message: 'VAL0071' })
  timezone?: string;

  active: boolean;

  @IsEnum(ValidRoles, { message: 'VAL0042' })
  @IsOptional()
  role: ValidRoles;
}
