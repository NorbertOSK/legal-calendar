import {
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { IUseCase } from 'src/shared/interfaces/use-case.interface';
import { User } from '../entities/user.entity';
import { ILawyersRepository } from '../repositories/lawyers.repository.interface';
import { RedisService } from 'src/modules/redis/redis.service';
import { UpdateLawyerDto } from '../dto/update-lawyer.dto';

export interface UpdateLawyerProfileInput {
  userId: string;
  dto: UpdateLawyerDto;
}

export interface UpdateLawyerProfileOutput {
  ok: boolean;
  msgCode: string;
  user: Omit<User, 'createdAt' | 'updatedAt'>;
}

@Injectable()
export class UpdateLawyerProfileUseCase
  implements IUseCase<UpdateLawyerProfileInput, UpdateLawyerProfileOutput>
{
  private readonly logger = new Logger(UpdateLawyerProfileUseCase.name);

  constructor(
    @Inject('ILawyersRepository')
    private readonly lawyersRepository: ILawyersRepository,
    private readonly redisService: RedisService,
  ) {}

  async execute({ userId, dto }: UpdateLawyerProfileInput): Promise<UpdateLawyerProfileOutput> {
    const existing = await this.lawyersRepository.findById(userId);
    if (!existing) {
      throw new NotFoundException({ ok: false, msgCode: 'SE0006' });
    }

    const updatedFields: Partial<User> = {};

    if (typeof dto.name === 'string') {
      updatedFields.name = dto.name.toLowerCase();
    }
    if (typeof dto.country === 'string') {
      updatedFields.country = dto.country;
    }
    if (typeof dto.timezone === 'string') {
      updatedFields.timezone = dto.timezone;
    }

    if (Object.keys(updatedFields).length === 0) {
      this.logger.warn(`No valid fields provided for user update ${existing.email}`);
      return {
        ok: true,
        msgCode: 'GEN0003',
        user: this.sanitize(existing),
      };
    }

    const updated = await this.lawyersRepository.update(userId, updatedFields);
    await this.redisService.deleteUserProfileCache(userId);

    this.logger.log(`User updated successfully: ${existing.email} [GEN0003]`);

    return {
      ok: true,
      msgCode: 'GEN0003',
      user: this.sanitize(updated),
    };
  }

  private sanitize(user: User): Omit<User, 'createdAt' | 'updatedAt'> {
    const { createdAt, updatedAt, ...rest } = user;
    return rest;
  }
}
