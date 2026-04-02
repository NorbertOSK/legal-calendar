import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { IUseCase } from 'src/shared/interfaces/use-case.interface';
import { EmailVerificationService } from 'src/modules/email-verification/email-verification.service';
import { EmailService } from 'src/modules/email/email.service';
import { VerifyEmailDto } from 'src/modules/email-verification/dto';
import { EmailVerificationPurpose } from 'src/modules/email-verification/enums/email-verification-purpose.enum';
import { JwtPayload } from '../interfaces';
import { IAuthRepository } from '../repositories/auth.repository.interface';
import { User } from 'src/modules/lawyers/entities/user.entity';

export interface VerifyOtpInput {
  verifyEmailDto: VerifyEmailDto;
  authToken?: string;
}

export interface VerifyOtpOutput {
  ok: boolean;
  msgCode: string;
  user: Omit<User, 'password' | 'updatedAt'>;
  token?: string;
}

@Injectable()
export class VerifyOtpUseCase implements IUseCase<VerifyOtpInput, VerifyOtpOutput> {
  constructor(
    @Inject('IAuthRepository')
    private readonly authRepository: IAuthRepository,
    private readonly emailVerificationService: EmailVerificationService,
    private readonly emailService: EmailService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async execute({ verifyEmailDto, authToken }: VerifyOtpInput): Promise<VerifyOtpOutput> {
    let requesterUserId: string | undefined;

    if (verifyEmailDto.purpose === EmailVerificationPurpose.CHANGE_EMAIL) {
      requesterUserId = await this.getRequesterUserId(authToken);
    }

    const verificationResult = await this.emailVerificationService.verifyCode(
      verifyEmailDto.purpose,
      verifyEmailDto.verificationToken,
      verifyEmailDto.securityCode,
      requesterUserId,
    );

    const user = await this.authRepository.findUserById(verificationResult.userId);

    if (!user) {
      throw new NotFoundException({ ok: false, msgCode: 'SE0006' });
    }

    const { password, updatedAt, ...userClean } = user as any;

    if (verifyEmailDto.purpose === EmailVerificationPurpose.SIGNUP) {
      const signupUser = userClean as User & { isNew?: boolean };
      signupUser.isNew = true;

      this.emailService.sendWelcome(user.email, user.name);

      return {
        ok: true,
        msgCode: 'SE0039',
        user: signupUser,
        token: this.getJwtToken({ uid: user.id, role: user.role }),
      };
    }

    return {
      ok: true,
      msgCode: 'GEN0003',
      user: userClean,
    };
  }

  private getJwtToken(payload: JwtPayload): string {
    return this.jwtService.sign(payload);
  }

  private async getRequesterUserId(authToken?: string): Promise<string> {
    if (!authToken) {
      throw new UnauthorizedException({ ok: false, msgCode: 'ST0001' });
    }

    try {
      const payload = this.jwtService.verify(authToken, {
        secret: this.configService.get('jwtSecret'),
      }) as JwtPayload;

      if (!payload?.uid) {
        throw new UnauthorizedException({ ok: false, msgCode: 'ST0001' });
      }

      const user = await this.authRepository.findUserById(payload.uid, [
        'id',
        'active',
      ]);

      if (!user || !user.active) {
        throw new ForbiddenException({ ok: false, msgCode: 'ST0002' });
      }

      return user.id;
    } catch (error) {
      if (
        error instanceof UnauthorizedException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }

      throw new UnauthorizedException({ ok: false, msgCode: 'ST0001' });
    }
  }
}
