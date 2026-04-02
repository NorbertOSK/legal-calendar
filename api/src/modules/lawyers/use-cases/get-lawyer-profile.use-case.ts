import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { IUseCase } from 'src/shared/interfaces/use-case.interface';
import { User } from '../entities/user.entity';
import { ILawyersRepository } from '../repositories/lawyers.repository.interface';
import { RedisService } from 'src/modules/redis/redis.service';

export interface GetLawyerProfileInput {
  userId: string;
  userEmail: string;
}

export interface GetLawyerProfileOutput {
  ok: boolean;
  myProfile: Omit<User, 'createdAt' | 'updatedAt'>;
}

const PROFILE_TTL_SECONDS = 7 * 24 * 60 * 60;

@Injectable()
export class GetLawyerProfileUseCase
  implements IUseCase<GetLawyerProfileInput, GetLawyerProfileOutput>
{
  private readonly logger = new Logger(GetLawyerProfileUseCase.name);

  constructor(
    @Inject('ILawyersRepository')
    private readonly lawyersRepository: ILawyersRepository,
    private readonly redisService: RedisService,
  ) {}

  async execute({ userId, userEmail }: GetLawyerProfileInput): Promise<GetLawyerProfileOutput> {
    const cacheKey = this.redisService.generateUserProfileKey(userId);

    const cached = await this.redisService.get<Omit<User, 'createdAt' | 'updatedAt'>>(cacheKey);
    if (cached) {
      this.logger.verbose(`DATA FROM CACHE - User: ${userEmail}`);
      return { ok: true, myProfile: cached };
    }

    this.logger.warn(`DATA FROM DATABASE - User: ${userEmail}`);

    const user = await this.lawyersRepository.findById(userId);
    if (!user) {
      throw new NotFoundException({ ok: false, msgCode: 'SE0006' });
    }

    const sanitized = this.sanitize(user);
    await this.redisService.set(cacheKey, sanitized, PROFILE_TTL_SECONDS);

    return { ok: true, myProfile: sanitized };
  }

  private sanitize(user: User): Omit<User, 'createdAt' | 'updatedAt'> {
    const { createdAt, updatedAt, ...rest } = user;
    return rest;
  }
}
