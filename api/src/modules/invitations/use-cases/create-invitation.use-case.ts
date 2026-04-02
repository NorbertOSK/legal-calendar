import {
  ConflictException,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { IUseCase } from 'src/shared/interfaces/use-case.interface';
import { AdminInvitation } from '../entities/admin-invitation.entity';
import { IInvitationsRepository } from '../repositories/invitations.repository.interface';
import { LawyersService } from 'src/modules/lawyers/service/lawyers.service';
import { EmailService } from 'src/modules/email/email.service';
import { User } from 'src/modules/lawyers/entities/user.entity';
import { ConfigService } from '@nestjs/config';

const INVITATION_TTL_MS = 72 * 60 * 60 * 1000;

export interface CreateInvitationInput {
  email: string;
  invitedBy: User;
}

export type CreateInvitationOutput = AdminInvitation;

@Injectable()
export class CreateInvitationUseCase
  implements IUseCase<CreateInvitationInput, CreateInvitationOutput>
{
  private readonly logger = new Logger(CreateInvitationUseCase.name);
  private readonly dashboardDomain: string;

  constructor(
    @Inject('IInvitationsRepository')
    private readonly invitationsRepository: IInvitationsRepository,
    private readonly lawyersService: LawyersService,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
  ) {
    this.dashboardDomain = this.configService.get<string>('dashboardDomain');
  }

  async execute({ email, invitedBy }: CreateInvitationInput): Promise<CreateInvitationOutput> {
    const normalizedEmail = email.toLowerCase().trim();

    let existingUser: User | null = null;
    try {
      existingUser = await this.lawyersService.findOne(normalizedEmail);
    } catch {
    }

    if (existingUser) {
      throw new ConflictException({ ok: false, msgCode: 'INV0001' });
    }

    const pendingInvitation =
      await this.invitationsRepository.findPendingByEmail(normalizedEmail);

    if (pendingInvitation && pendingInvitation.expiresAt > new Date()) {
      throw new ConflictException({ ok: false, msgCode: 'INV0002' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + INVITATION_TTL_MS);

    const saved = await this.invitationsRepository.save({
      email: normalizedEmail,
      invitedById: invitedBy.id,
      token,
      expiresAt,
    });

    const invitationLink = `${this.dashboardDomain}/auth/register-invited?token=${token}`;

    this.emailService.sendInvitation(normalizedEmail, invitedBy.name, invitationLink);

    this.logger.log(
      `Invitation created for ${normalizedEmail} by ${invitedBy.email}`,
    );

    return saved;
  }
}
