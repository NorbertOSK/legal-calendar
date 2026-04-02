import {
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { IUseCase } from 'src/shared/interfaces/use-case.interface';
import { LawyersService } from 'src/modules/lawyers/lawyers.service';
import { EmailService } from 'src/modules/email/email.service';
import { ResetPasswordDto } from '../dto';
import { User } from 'src/modules/lawyers/entities/user.entity';
import { IAuthRepository } from '../repositories/auth.repository.interface';

export interface ResetPasswordInput {
  resetPasswordDto: ResetPasswordDto;
  user: User;
}

export interface ResetPasswordOutput {
  ok: boolean;
  msgCode: string;
}

@Injectable()
export class ResetPasswordUseCase
  implements IUseCase<ResetPasswordInput, ResetPasswordOutput>
{
  private readonly logger = new Logger(ResetPasswordUseCase.name);

  constructor(
    @Inject('IAuthRepository')
    private readonly authRepository: IAuthRepository,
    private readonly usersService: LawyersService,
    private readonly emailService: EmailService,
  ) {}

  async execute({
    resetPasswordDto,
    user,
  }: ResetPasswordInput): Promise<ResetPasswordOutput> {
    try {
      const encryptedPassword = this.usersService.hashPassword(
        resetPasswordDto.newPassword,
      );

      await this.authRepository.updateUser(user.id, {
        password: encryptedPassword,
      });

      this.emailService.sendResetPasswordConfirmation(user.email, user.name);

      this.logger.log(
        `User with ID [${user.id}] changed password successfully [SE0002]`,
      );

      return { ok: true, msgCode: 'SE0002' };
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException({ ok: false, msgCode: 'GEN0001' });
    }
  }
}
