import { Inject, Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import * as ms from 'ms';
import { ConfigService } from '@nestjs/config';
import { IUseCase } from 'src/shared/interfaces/use-case.interface';
import { LawyersService } from 'src/modules/lawyers/lawyers.service';
import { EmailVerificationService } from 'src/modules/email-verification/email-verification.service';
import { CreateUserDto } from '../dto';
import { ValidRoles } from '../interfaces/validRoles';
import { User } from 'src/modules/lawyers/entities/user.entity';
import { IAuthRepository } from '../repositories/auth.repository.interface';

export interface RegisterInput {
  createUserDto: CreateUserDto;
}

export interface RegisterOutput {
  ok: boolean;
  msgCode: string;
  user: Omit<User, 'password' | 'updatedAt' | 'isNew'>;
  verificationToken: string;
  expiresAt: Date;
  refreshToken: string;
}

@Injectable()
export class RegisterUseCase implements IUseCase<RegisterInput, RegisterOutput> {
  constructor(
    @Inject('IAuthRepository')
    private readonly authRepository: IAuthRepository,
    private readonly usersService: LawyersService,
    private readonly emailVerificationService: EmailVerificationService,
    private readonly configService: ConfigService,
  ) {}

  async execute({ createUserDto }: RegisterInput): Promise<RegisterOutput> {
    const signupDto: CreateUserDto = {
      ...createUserDto,
      role: ValidRoles.LAWYER,
    };

    const user: User = await this.usersService.create(signupDto);

    const verification =
      await this.emailVerificationService.createSignupVerification(user);

    const refreshToken = await this.generateRefreshToken(user.id);

    const { password, updatedAt, isNew: _isNew, ...userClean } = user as any;

    return {
      ok: true,
      msgCode: 'SE0040',
      user: userClean,
      verificationToken: verification.verificationToken,
      expiresAt: verification.expiresAt,
      refreshToken,
    };
  }

  private async generateRefreshToken(userId: string): Promise<string> {
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto
      .createHash('sha256')
      .update(rawToken)
      .digest('hex');

    const expireIn =
      this.configService.get<string>('jwtRefreshExpireIn') || '7d';
    const expiresMs = ms(expireIn as ms.StringValue);
    const expiresAt = new Date(Date.now() + expiresMs);

    await this.authRepository.saveRefreshToken({ userId, tokenHash, expiresAt });

    return rawToken;
  }
}
