import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { IUseCase } from 'src/shared/interfaces/use-case.interface';
import { User, UserStatus } from '../entities/user.entity';
import { ILawyersRepository } from '../repositories/lawyers.repository.interface';
import { RedisService } from 'src/modules/redis/redis.service';

export interface ToggleLawyerStatusInput {
  targetUserId: string;
  adminId: string;
}

export interface ToggleLawyerStatusOutput {
  ok: boolean;
  msgCode: string;
  user: Omit<User, 'createdAt' | 'updatedAt'>;
}

@Injectable()
export class ToggleLawyerStatusUseCase
  implements IUseCase<ToggleLawyerStatusInput, ToggleLawyerStatusOutput>
{
  private readonly logger = new Logger(ToggleLawyerStatusUseCase.name);

  constructor(
    @Inject('ILawyersRepository')
    private readonly lawyersRepository: ILawyersRepository,
    private readonly redisService: RedisService,
  ) {}

  async execute({ targetUserId, adminId }: ToggleLawyerStatusInput): Promise<ToggleLawyerStatusOutput> {
    if (targetUserId === adminId) {
      throw new BadRequestException({ ok: false, msgCode: 'GU0003' });
    }

    const user = await this.lawyersRepository.findById(targetUserId);
    if (!user) {
      throw new NotFoundException({ ok: false, msgCode: 'SE0006' });
    }

    const newActive = !user.active;
    const newStatus = newActive ? UserStatus.ACTIVE : UserStatus.SUSPENDED;

    const updated = await this.lawyersRepository.update(targetUserId, {
      active: newActive,
      status: newStatus,
    });

    await this.redisService.deleteUserProfileCache(targetUserId);

    this.logger.log(
      `Toggled status for user ${user.email}: active=${user.active}->${newActive}, status=${user.status}->${newStatus}`,
    );

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
