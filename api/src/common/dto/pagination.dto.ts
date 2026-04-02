import { IsNumber, IsOptional, IsPositive, Max, Min } from 'class-validator';

export class PaginationDto {
  @IsOptional()
  @IsNumber({}, { message: 'VAL0091' })
  @IsPositive({ message: 'VAL0092' })
  @Min(1, { message: 'VAL0093' })
  @Max(100, { message: 'VAL0096' })
  limit?: number = 20;

  @IsOptional()
  @IsNumber({}, { message: 'VAL0094' })
  @Min(1, { message: 'VAL0095' })
  page?: number = 1;
}
