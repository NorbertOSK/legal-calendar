import { Inject, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import * as ms from 'ms';
import { IUseCase } from 'src/shared/interfaces/use-case.interface';
import { UserStatus } from 'src/modules/lawyers/entities/user.entity';
import { JwtPayload } from '../interfaces';
import { IAuthRepository } from '../repositories/auth.repository.interface';

export interface RefreshTokenInput {
  refreshToken: string;
}

export interface RefreshTokenOutput {
  ok: boolean;
  token: string;
  refreshToken: string;
}

@Injectable()
export class RefreshTokenUseCase
  implements IUseCase<RefreshTokenInput, RefreshTokenOutput>
{
  private readonly logger = new Logger(RefreshTokenUseCase.name);

  constructor(
    @Inject('IAuthRepository')
    private readonly authRepository: IAuthRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async execute({ refreshToken }: RefreshTokenInput): Promise<RefreshTokenOutput> {
    const tokenHash = crypto
      .createHash('sha256')
      .update(refreshToken)
      .digest('hex');

    const existing = await this.authRepository.findRefreshTokenByHash(
      tokenHash,
      true,
    );

    if (!existing) {
      throw new UnauthorizedException({ ok: false, msgCode: 'ST0001' });
    }

    if (existing.expiresAt < new Date()) {
      throw new UnauthorizedException({ ok: false, msgCode: 'ST0001' });
    }

    await this.authRepository.deleteRefreshToken(existing);

    const user = existing.user;

    if (!user.active) {
      throw new UnauthorizedException({ ok: false, msgCode: 'ST0002' });
    }

    if (user.status === UserStatus.SUSPENDED) {
      throw new UnauthorizedException({ ok: false, msgCode: 'ST0004' });
    }

    if (!user.emailVerifiedAt) {
      throw new UnauthorizedException({ ok: false, msgCode: 'SE0044' });
    }

    const newRefreshToken = await this.generateRefreshToken(user.id);

    return {
      ok: true,
      token: this.getJwtToken({ uid: user.id, role: user.role }),
      refreshToken: newRefreshToken,
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

  private getJwtToken(payload: JwtPayload): string {
    return this.jwtService.sign(payload);
  }
}
