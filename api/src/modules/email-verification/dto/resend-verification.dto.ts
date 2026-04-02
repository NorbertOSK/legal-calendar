import { IsEnum, IsString } from 'class-validator';
import { EmailVerificationPurpose } from '../enums/email-verification-purpose.enum';

export class ResendVerificationDto {
  @IsEnum(EmailVerificationPurpose, { message: 'VAL0051' })
  purpose: EmailVerificationPurpose;

  @IsString({ message: 'VAL0012' })
  verificationToken: string;
}
