import {
  IsString,
  IsNotEmpty,
  IsEmail,
  IsEnum,
  IsISO8601,
  IsOptional,
  Length,
  MaxLength,
  Matches,
  IsUrl,
  ValidateIf,
} from 'class-validator';
import { AppointmentType } from '../enums/appointment-type.enum';

export class CreateAppointmentDto {
  @IsNotEmpty({ message: 'VAL1011' })
  @IsString({ message: 'VAL1011' })
  @Length(3, 255, { message: 'VAL1012' })
  title: string;

  @IsNotEmpty({ message: 'VAL1021' })
  @IsString({ message: 'VAL1021' })
  @Matches(/^[\p{L}\s'-]+$/u, { message: 'VAL1022' })
  clientName: string;

  @IsNotEmpty({ message: 'VAL1031' })
  @IsEmail({}, { message: 'VAL1031' })
  clientEmail: string;

  @ValidateIf((o) => o.type === AppointmentType.PHONE)
  @IsNotEmpty({ message: 'VAL1041' })
  @Matches(/^\+?[\d\s\-()]+$/, { message: 'VAL1041' })
  clientPhone?: string;

  @IsOptional()
  @Matches(/^[\w\/]+$/, { message: 'VAL1051' })
  clientTimezone?: string;

  @IsNotEmpty({ message: 'VAL1061' })
  @IsEnum(AppointmentType, { message: 'VAL1061' })
  type: AppointmentType;

  @IsNotEmpty({ message: 'VAL1071' })
  @IsISO8601({ strict: true }, { message: 'VAL1071' })
  startsAt: string;

  @IsNotEmpty({ message: 'VAL1081' })
  @IsISO8601({ strict: true }, { message: 'VAL1081' })
  endsAt: string;

  @IsOptional()
  @IsString({ message: 'VAL1091' })
  @MaxLength(2000, { message: 'VAL1091' })
  description?: string;

  @ValidateIf((o) => o.type === AppointmentType.IN_PERSON)
  @IsNotEmpty({ message: 'VAL1101' })
  @IsString({ message: 'VAL1101' })
  @MaxLength(500, { message: 'VAL1101' })
  location?: string;

  @ValidateIf((o) => o.type === AppointmentType.VIDEO_CALL)
  @IsNotEmpty({ message: 'VAL1111' })
  @IsUrl({}, { message: 'VAL1111' })
  meetingLink?: string;
}
