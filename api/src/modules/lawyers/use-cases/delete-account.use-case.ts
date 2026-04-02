import {
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { IUseCase } from 'src/shared/interfaces/use-case.interface';
import { ILawyersRepository } from '../repositories/lawyers.repository.interface';
import { RedisService } from 'src/modules/redis/redis.service';
import { UserStatus } from '../entities/user.entity';
import { validate as isUUID } from 'uuid';

export interface DeleteAccountInput {
  userId: string;
}

export interface DeleteAccountOutput {
  ok: boolean;
  msgCode: string;
}

@Injectable()
export class DeleteAccountUseCase
  implements IUseCase<DeleteAccountInput, DeleteAccountOutput>
{
  private readonly logger = new Logger(DeleteAccountUseCase.name);

  constructor(
    @Inject('ILawyersRepository')
    private readonly lawyersRepository: ILawyersRepository,
    private readonly redisService: RedisService,
  ) {}

  async execute({ userId }: DeleteAccountInput): Promise<DeleteAccountOutput> {
    const userToRemove = await this.findUser(userId);

    const now = new Date();
    const timestamp = now
      .toISOString()
      .replace(/[-:]/g, '')
      .replace('T', '_')
      .split('.')[0];
    const deletedEmail = `DEL_${timestamp}_${userToRemove.email}`;

    await this.lawyersRepository.update(userToRemove.id, {
      email: deletedEmail,
      active: false,
      status: UserStatus.SUSPENDED,
    });

    await this.redisService.deleteUserProfileCache(userId);

    this.logger.log(
      `User account deactivated: ${userToRemove.email} -> ${deletedEmail} [GEN0004]`,
    );
    return { ok: true, msgCode: 'GEN0004' };
  }

  private async findUser(term: string) {
    let user = null;

    if (isUUID(term)) {
      user = await this.lawyersRepository.findById(term);
    } else if (term.includes('@')) {
      user = await this.lawyersRepository.findByEmail(term);
    }

    if (!user) {
      this.logger.error(`User not found [SE0006]`);
      throw new NotFoundException({ ok: false, msgCode: 'SE0006' });
    }

    if (!user.active) {
      this.logger.error(`Inactive user: ${user.email} [ST0002]`);
      throw new NotFoundException({ ok: false, msgCode: 'ST0002' });
    }

    return user;
  }
}
