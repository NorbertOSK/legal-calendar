import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { AdminInvitation } from '../entities/admin-invitation.entity';
import { IInvitationsRepository } from './invitations.repository.interface';

@Injectable()
export class InvitationsRepository implements IInvitationsRepository {
  constructor(
    @InjectRepository(AdminInvitation)
    private readonly repo: Repository<AdminInvitation>,
  ) {}

  async findByToken(token: string): Promise<AdminInvitation | null> {
    return this.repo.findOne({ where: { token } });
  }

  async findByEmail(email: string): Promise<AdminInvitation | null> {
    return this.repo.findOne({ where: { email } });
  }

  async findPendingByEmail(email: string): Promise<AdminInvitation | null> {
    return this.repo.findOne({
      where: { email, acceptedAt: IsNull() },
    });
  }

  async save(data: Partial<AdminInvitation>): Promise<AdminInvitation> {
    const instance = this.repo.create(data);
    return this.repo.save(instance);
  }

  async findAll(): Promise<AdminInvitation[]> {
    return this.repo.find({
      relations: ['invitedBy'],
      order: { createdAt: 'DESC' },
    });
  }

  async findById(id: string): Promise<AdminInvitation | null> {
    return this.repo.findOne({ where: { id }, relations: ['invitedBy'] });
  }
}
