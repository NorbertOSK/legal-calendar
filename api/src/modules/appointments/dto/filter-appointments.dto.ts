import {
  IsOptional,
  IsEnum,
  IsISO8601,
  IsEmail,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { AppointmentStatus } from '../enums/appointment-status.enum';

export class FilterAppointmentsDto {
  @IsOptional()
  @IsEnum(AppointmentStatus, { message: 'VAL1201' })
  status?: AppointmentStatus;

  @IsOptional()
  @IsISO8601({ strict: true }, { message: 'VAL1211' })
  from?: string;

  @IsOptional()
  @IsISO8601({ strict: true }, { message: 'VAL1221' })
  to?: string;

  @IsOptional()
  @IsEmail({}, { message: 'VAL1231' })
  clientEmail?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'VAL1241' })
  @Min(1, { message: 'VAL1241' })
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'VAL1251' })
  @Min(1, { message: 'VAL1251' })
  @Max(100, { message: 'VAL1251' })
  limit?: number = 20;
}
