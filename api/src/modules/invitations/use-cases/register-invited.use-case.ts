import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { IUseCase } from 'src/shared/interfaces/use-case.interface';
import { User } from 'src/modules/lawyers/entities/user.entity';
import { ValidRoles } from 'src/modules/auth/interfaces/validRoles';
import { IInvitationsRepository } from '../repositories/invitations.repository.interface';
import { LawyersService } from 'src/modules/lawyers/service/lawyers.service';

export interface RegisterInvitedInput {
  token: string;
  userData: { name: string; password: string };
}

export type RegisterInvitedOutput = User;

@Injectable()
export class RegisterInvitedUseCase
  implements IUseCase<RegisterInvitedInput, RegisterInvitedOutput>
{
  private readonly logger = new Logger(RegisterInvitedUseCase.name);

  constructor(
    @Inject('IInvitationsRepository')
    private readonly invitationsRepository: IInvitationsRepository,
    private readonly lawyersService: LawyersService,
  ) {}

  async execute({ token, userData }: RegisterInvitedInput): Promise<RegisterInvitedOutput> {
    const invitation = await this.invitationsRepository.findByToken(token);

    if (!invitation) {
      throw new BadRequestException({ ok: false, msgCode: 'INV0005' });
    }

    if (invitation.acceptedAt) {
      throw new BadRequestException({ ok: false, msgCode: 'INV0004' });
    }

    if (invitation.expiresAt < new Date()) {
      throw new BadRequestException({ ok: false, msgCode: 'INV0006' });
    }

    const emailVerifiedAt = new Date();

    const user = await this.lawyersService.create(
      {
        email: invitation.email,
        name: userData.name,
        password: userData.password,
        role: ValidRoles.LAWYER,
        active: true,
      },
      { emailVerifiedAt },
    );

    user.emailVerifiedAt = emailVerifiedAt;

    invitation.acceptedAt = new Date();
    await this.invitationsRepository.save(invitation);

    this.logger.log(
      `Invitation accepted: ${invitation.email} registered as LAWYER`,
    );

    return user;
  }
}
