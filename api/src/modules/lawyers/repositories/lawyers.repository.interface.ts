import { User } from '../entities/user.entity';

export interface ILawyersRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findByEmailWithPassword(email: string): Promise<User | null>;
  findAll(pagination?: { limit?: number; offset?: number }): Promise<[User[], number]>;
  save(data: Partial<User>): Promise<User>;
  update(id: string, data: Partial<User>): Promise<User>;
}
