import {
  ForbiddenException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { Inject } from '@nestjs/common';

import { IUseCase } from 'src/shared/interfaces/use-case.interface';
import { User } from 'src/modules/lawyers/entities/user.entity';
import { EmailVerificationService } from 'src/modules/email-verification/email-verification.service';
import {
  ResendVerificationDto,
  VerifyEmailDto,
} from 'src/modules/email-verification/dto';
import { EmailVerificationPurpose } from 'src/modules/email-verification/enums/email-verification-purpose.enum';

import { CreateUserDto, ForgotPasswordDto, ResetPasswordDto } from '../dto';
import { LoginUserDto } from '../dto/login-user.dto';
import { JwtPayload } from '../interfaces';

import {
  LoginInput,
  LoginOutput,
} from '../use-cases/login.use-case';
import {
  RegisterInput,
  RegisterOutput,
} from '../use-cases/register.use-case';
import {
  VerifyOtpInput,
  VerifyOtpOutput,
} from '../use-cases/verify-otp.use-case';
import {
  RecoverPasswordInput,
  RecoverPasswordOutput,
} from '../use-cases/recover-password.use-case';
import {
  ResetPasswordInput,
  ResetPasswordOutput,
} from '../use-cases/reset-password.use-case';
import {
  RefreshTokenInput,
  RefreshTokenOutput,
} from '../use-cases/refresh-token.use-case';
import { IAuthRepository } from '../repositories/auth.repository.interface';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @Inject('LoginUseCase')
    private readonly loginUseCase: IUseCase<LoginInput, LoginOutput>,
    @Inject('RegisterUseCase')
    private readonly registerUseCase: IUseCase<RegisterInput, RegisterOutput>,
    @Inject('VerifyOtpUseCase')
    private readonly verifyOtpUseCase: IUseCase<VerifyOtpInput, VerifyOtpOutput>,
    @Inject('RecoverPasswordUseCase')
    private readonly recoverPasswordUseCase: IUseCase<
      RecoverPasswordInput,
      RecoverPasswordOutput
    >,
    @Inject('ResetPasswordUseCase')
    private readonly resetPasswordUseCase: IUseCase<
      ResetPasswordInput,
      ResetPasswordOutput
    >,
    @Inject('RefreshTokenUseCase')
    private readonly refreshTokenUseCase: IUseCase<
      RefreshTokenInput,
      RefreshTokenOutput
    >,
    @Inject('IAuthRepository')
    private readonly authRepository: IAuthRepository,
    private readonly emailVerificationService: EmailVerificationService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  signup(createUserDto: CreateUserDto) {
    return this.registerUseCase.execute({ createUserDto });
  }

  verifyEmail(verifyEmailDto: VerifyEmailDto, authToken?: string) {
    return this.verifyOtpUseCase.execute({ verifyEmailDto, authToken });
  }

  async resendVerification(
    resendVerificationDto: ResendVerificationDto,
    authToken?: string,
  ) {
    let requesterUserId: string | undefined;
    if (resendVerificationDto.purpose === EmailVerificationPurpose.CHANGE_EMAIL) {
      requesterUserId = await this.getRequesterUserId(authToken);
    }

    const resendResult = await this.emailVerificationService.resendVerification(
      resendVerificationDto.purpose,
      resendVerificationDto.verificationToken,
      requesterUserId,
    );

    return {
      ok: true,
      msgCode: 'SE0042',
      verificationToken: resendResult.verificationToken,
      expiresAt: resendResult.expiresAt,
    };
  }

  login(loginUserDto: LoginUserDto) {
    return this.loginUseCase.execute({ loginUserDto });
  }

  forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    return this.recoverPasswordUseCase.execute({ forgotPasswordDto });
  }

  resetPassword(resetPasswordDto: ResetPasswordDto, user: User) {
    return this.resetPasswordUseCase.execute({ resetPasswordDto, user });
  }

  async checkAuthStatus(user: User) {
    this.logger.log(`Token renewed for: ${user.email}`);

    const { password, updatedAt, ...userClean } = user as any;

    return {
      ok: true,
      user: userClean,
      token: this.getJwtToken(this.createJwtPayload(user)),
    };
  }

  refreshTokens(refreshToken: string) {
    return this.refreshTokenUseCase.execute({ refreshToken });
  }

  async logout(refreshToken: string) {
    const tokenHash = crypto
      .createHash('sha256')
      .update(refreshToken)
      .digest('hex');

    const existing = await this.authRepository.findRefreshTokenByHash(tokenHash);

    if (existing) {
      await this.authRepository.deleteRefreshToken(existing);
    }

    return { ok: true };
  }

  async logoutAll(userId: string) {
    await this.authRepository.deleteAllUserTokens(userId);

    this.logger.log(`All refresh tokens deleted for user ${userId}`);
    return { ok: true };
  }

  private getJwtToken(payload: JwtPayload): string {
    return this.jwtService.sign(payload);
  }

  private createJwtPayload(user: User): JwtPayload {
    return { uid: user.id, role: user.role };
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
