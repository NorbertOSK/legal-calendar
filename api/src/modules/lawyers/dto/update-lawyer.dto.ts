import { IsOptional, IsString, Length, Matches, MaxLength } from 'class-validator';

export class UpdateLawyerDto {
  @IsOptional()
  @IsString({ message: 'VAL0012' })
  @Length(3, 100, { message: 'VAL0013' })
  @Matches(/^[\p{L}\s'-]+$/u, { message: 'VAL0015' })
  name?: string;

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
}
