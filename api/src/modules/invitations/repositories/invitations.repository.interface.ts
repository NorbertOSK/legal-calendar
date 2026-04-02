import { AdminInvitation } from '../entities/admin-invitation.entity';

export interface IInvitationsRepository {
  findByToken(token: string): Promise<AdminInvitation | null>;
  findByEmail(email: string): Promise<AdminInvitation | null>;
  findPendingByEmail(email: string): Promise<AdminInvitation | null>;
  save(data: Partial<AdminInvitation>): Promise<AdminInvitation>;
  findAll(): Promise<AdminInvitation[]>;
  findById(id: string): Promise<AdminInvitation | null>;
}
