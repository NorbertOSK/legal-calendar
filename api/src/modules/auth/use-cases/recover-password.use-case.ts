import {
  HttpException,
  Injectable,
  InternalServerErrorException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { IUseCase } from 'src/shared/interfaces/use-case.interface';
import { LawyersService } from 'src/modules/lawyers/lawyers.service';
import { EmailService } from 'src/modules/email/email.service';
import { ForgotPasswordDto } from '../dto';

export interface RecoverPasswordInput {
  forgotPasswordDto: ForgotPasswordDto;
}

export interface RecoverPasswordOutput {
  ok: boolean;
  msgCode: string;
}

@Injectable()
export class RecoverPasswordUseCase
  implements IUseCase<RecoverPasswordInput, RecoverPasswordOutput>
{
  private readonly logger = new Logger(RecoverPasswordUseCase.name);
  private readonly dashboardDomain: string;

  constructor(
    private readonly usersService: LawyersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
  ) {
    this.dashboardDomain = this.configService.get<string>('dashboardDomain');
  }

  async execute({
    forgotPasswordDto,
  }: RecoverPasswordInput): Promise<RecoverPasswordOutput> {
    try {
      const user = await this.usersService.findOne(forgotPasswordDto.email);

      this.isUserActive(user.active);

      const token = this.jwtService.sign(
        { uid: user.id },
        {
          expiresIn: this.configService.get('jwtForgetPasswordExpireIn'),
          secret: this.configService.get('forgotPasswordJwtSecret'),
        },
      );

      const resetLink = `${this.dashboardDomain}/auth/reset-password/?token=${token}`;

      this.emailService.sendForgotPassword(user.email, user.name, resetLink);

      this.logger.log(`Recovery email sent to ${user.email} [SE0001]`);

      return { ok: true, msgCode: 'SE0001' };
    } catch (error) {
      this.handleExceptions(error);
    }
  }

  private isUserActive(isActive: boolean): void {
    if (!isActive) {
      this.logger.warn('Inactive user [ST0002]');
      throw new UnauthorizedException({ ok: false, msgCode: 'ST0002' });
    }
  }

  private handleExceptions(error: any): never {
    if (error instanceof HttpException) {
      throw error;
    }
    this.logger.error(error);
    throw new InternalServerErrorException({ ok: false, msgCode: 'GEN0001' });
  }
}
