import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { ConfigService } from '@nestjs/config';
import { AdminInvitation } from '../entities/admin-invitation.entity';
import { User } from 'src/modules/lawyers/entities/user.entity';
import { IInvitationsRepository } from '../repositories/invitations.repository.interface';
import { CreateInvitationUseCase } from '../use-cases/create-invitation.use-case';
import { RegisterInvitedUseCase } from '../use-cases/register-invited.use-case';
import { EmailService } from 'src/modules/email/email.service';

@Injectable()
export class InvitationsService {
  private readonly logger = new Logger(InvitationsService.name);
  private readonly dashboardDomain: string;

  constructor(
    @Inject('IInvitationsRepository')
    private readonly invitationsRepository: IInvitationsRepository,
    private readonly createInvitationUseCase: CreateInvitationUseCase,
    private readonly registerInvitedUseCase: RegisterInvitedUseCase,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
  ) {
    this.dashboardDomain = this.configService.get<string>('dashboardDomain');
  }

  async create(email: string, invitedBy: User): Promise<AdminInvitation> {
    return this.createInvitationUseCase.execute({ email, invitedBy });
  }

  async findAll(): Promise<AdminInvitation[]> {
    return this.invitationsRepository.findAll();
  }

  async resend(id: string): Promise<void> {
    const invitation = await this.invitationsRepository.findById(id);

    if (!invitation) {
      throw new NotFoundException({ ok: false, msgCode: 'INV0003' });
    }

    if (invitation.acceptedAt) {
      throw new BadRequestException({ ok: false, msgCode: 'INV0004' });
    }

    if (invitation.expiresAt < new Date()) {
      invitation.token = crypto.randomBytes(32).toString('hex');
      invitation.expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000);
      await this.invitationsRepository.save(invitation);
    }

    const invitationLink = `${this.dashboardDomain}/auth/register-invited?token=${invitation.token}`;

    this.emailService.sendInvitation(
      invitation.email,
      invitation.invitedBy.name,
      invitationLink,
    );

    this.logger.log(`Invitation resent to ${invitation.email}`);
  }

  async validateToken(token: string): Promise<{ valid: boolean; email?: string }> {
    const invitation = await this.invitationsRepository.findByToken(token);

    if (!invitation) return { valid: false };
    if (invitation.acceptedAt) return { valid: false };
    if (invitation.expiresAt < new Date()) return { valid: false };

    return { valid: true, email: invitation.email };
  }

  async acceptInvitation(
    token: string,
    userData: { name: string; password: string },
  ): Promise<User> {
    return this.registerInvitedUseCase.execute({ token, userData });
  }
}
