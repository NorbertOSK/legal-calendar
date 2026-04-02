import { User } from 'src/modules/lawyers/entities/user.entity';
import { RefreshToken } from '../entities/refresh-token.entity';

export interface IAuthRepository {
  findUserById(id: string): Promise<User | null>;
  findUserById(id: string, select: (keyof User)[]): Promise<User | null>;
  findUserByEmail(email: string): Promise<User | null>;
  findUserByEmailWithPassword(email: string): Promise<User | null>;
  saveUser(user: Partial<User>): Promise<User>;
  updateUser(id: string, data: Partial<User>): Promise<void>;
  findRefreshTokenByHash(
    tokenHash: string,
    withUser?: boolean,
  ): Promise<RefreshToken | null>;
  saveRefreshToken(entity: Partial<RefreshToken>): Promise<RefreshToken>;
  deleteRefreshToken(entity: RefreshToken): Promise<void>;
  deleteAllUserTokens(userId: string): Promise<void>;
  createRefreshTokenEntity(data: Partial<RefreshToken>): RefreshToken;
}
