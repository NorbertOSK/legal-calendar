import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/modules/lawyers/entities/user.entity';
import { RefreshToken } from '../entities/refresh-token.entity';
import { IAuthRepository } from './auth.repository.interface';

@Injectable()
export class AuthRepository implements IAuthRepository {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepo: Repository<RefreshToken>,
  ) {}

  findUserById(id: string, select?: (keyof User)[]): Promise<User | null> {
    if (select) {
      const selectObj = select.reduce(
        (acc, key) => ({ ...acc, [key]: true }),
        {} as Record<string, boolean>,
      );
      return this.userRepo.findOne({ where: { id }, select: selectObj as any });
    }
    return this.userRepo.findOne({ where: { id } });
  }

  findUserByEmail(email: string): Promise<User | null> {
    return this.userRepo.findOne({ where: { email } });
  }

  findUserByEmailWithPassword(email: string): Promise<User | null> {
    return this.userRepo
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.email = :email', { email })
      .getOne();
  }

  async saveUser(data: Partial<User>): Promise<User> {
    const entity = this.userRepo.create(data);
    return this.userRepo.save(entity);
  }

  async updateUser(id: string, data: Partial<User>): Promise<void> {
    await this.userRepo.update(id, data);
  }

  findRefreshTokenByHash(
    tokenHash: string,
    withUser = false,
  ): Promise<RefreshToken | null> {
    return this.refreshTokenRepo.findOne({
      where: { tokenHash },
      relations: withUser ? ['user'] : [],
    });
  }

  async saveRefreshToken(data: Partial<RefreshToken>): Promise<RefreshToken> {
    const entity = this.refreshTokenRepo.create(data);
    return this.refreshTokenRepo.save(entity);
  }

  async deleteRefreshToken(entity: RefreshToken): Promise<void> {
    await this.refreshTokenRepo.remove(entity);
  }

  async deleteAllUserTokens(userId: string): Promise<void> {
    await this.refreshTokenRepo.delete({ userId });
  }

  createRefreshTokenEntity(data: Partial<RefreshToken>): RefreshToken {
    return this.refreshTokenRepo.create(data);
  }
}
