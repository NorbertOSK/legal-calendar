import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { ILawyersRepository } from './lawyers.repository.interface';

@Injectable()
export class LawyersRepository implements ILawyersRepository {
  constructor(
    @InjectRepository(User)
    private readonly repo: Repository<User>,
  ) {}

  async findById(id: string): Promise<User | null> {
    return this.repo.findOne({ where: { id } });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.repo.findOne({ where: { email } });
  }

  async findByEmailWithPassword(email: string): Promise<User | null> {
    return this.repo.findOne({
      where: { email },
      select: {
        id: true,
        email: true,
        password: true,
        role: true,
        name: true,
        active: true,
        status: true,
        emailVerifiedAt: true,
      },
    });
  }

  async findAll(
    pagination?: { limit?: number; offset?: number },
  ): Promise<[User[], number]> {
    return this.repo.findAndCount({
      order: { createdAt: 'DESC' },
      take: pagination?.limit,
      skip: pagination?.offset,
    });
  }

  async save(data: Partial<User>): Promise<User> {
    const instance = this.repo.create(data);
    return this.repo.save(instance);
  }

  async update(id: string, data: Partial<User>): Promise<User> {
    await this.repo.update(id, data);
    return this.repo.findOne({ where: { id } });
  }
}
