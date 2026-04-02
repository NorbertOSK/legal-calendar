import { IsMongoId, IsOptional } from 'class-validator';

export class UserId {
  @IsOptional()
  @IsMongoId({ message: 'VAL0101' })
  userId?: string;
}
