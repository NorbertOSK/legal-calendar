import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { IUseCase } from 'src/shared/interfaces/use-case.interface';
import { ILawyersRepository } from '../repositories/lawyers.repository.interface';
import { EmailVerificationService } from 'src/modules/email-verification/email-verification.service';

export interface RequestChangeEmailInput {
  userId: string;
  newEmail: string;
}

export interface RequestChangeEmailOutput {
  ok: boolean;
  msgCode: string;
  verificationToken: string;
  expiresAt: Date;
}

@Injectable()
export class RequestChangeEmailUseCase
  implements IUseCase<RequestChangeEmailInput, RequestChangeEmailOutput>
{
  private readonly logger = new Logger(RequestChangeEmailUseCase.name);

  constructor(
    @Inject('ILawyersRepository')
    private readonly lawyersRepository: ILawyersRepository,
    private readonly emailVerificationService: EmailVerificationService,
  ) {}

  async execute({
    userId,
    newEmail,
  }: RequestChangeEmailInput): Promise<RequestChangeEmailOutput> {
    const normalizedEmail = newEmail.toLowerCase().trim();
    const currentUser = await this.lawyersRepository.findById(userId);

    if (!currentUser) {
      throw new NotFoundException({ ok: false, msgCode: 'SE0006' });
    }

    if (!currentUser.active) {
      this.logger.error(`Inactive user: ${currentUser.email} [ST0002]`);
      throw new BadRequestException({ ok: false, msgCode: 'ST0002' });
    }

    if (normalizedEmail === currentUser.email) {
      throw new BadRequestException({ ok: false, msgCode: 'VAL0022' });
    }

    const existingUser =
      await this.lawyersRepository.findByEmail(normalizedEmail);
    if (existingUser && existingUser.id !== currentUser.id) {
      throw new BadRequestException({ ok: false, msgCode: 'SE0025' });
    }

    const verification =
      await this.emailVerificationService.createChangeEmailVerification(
        currentUser,
        normalizedEmail,
      );

    return {
      ok: true,
      msgCode: 'SE0040',
      verificationToken: verification.verificationToken,
      expiresAt: verification.expiresAt,
    };
  }
}
