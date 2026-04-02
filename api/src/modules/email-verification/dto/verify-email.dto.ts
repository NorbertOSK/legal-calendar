import { IsEnum, IsString, Length, Matches } from 'class-validator';
import { EmailVerificationPurpose } from '../enums/email-verification-purpose.enum';

export class VerifyEmailDto {
  @IsEnum(EmailVerificationPurpose, { message: 'VAL0051' })
  purpose: EmailVerificationPurpose;

  @IsString({ message: 'VAL0012' })
  verificationToken: string;

  @IsString({ message: 'VAL0012' })
  @Length(6, 6, { message: 'VAL0013' })
  @Matches(/^\d{6}$/, { message: 'VAL0013' })
  securityCode: string;
}
