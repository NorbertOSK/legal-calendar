import { Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as crypto from 'crypto';
import * as ms from 'ms';
import { ConfigService } from '@nestjs/config';
import { IUseCase } from 'src/shared/interfaces/use-case.interface';
import { LawyersService } from 'src/modules/lawyers/lawyers.service';
import { LoginUserDto } from '../dto/login-user.dto';
import { JwtPayload } from '../interfaces';
import { User } from 'src/modules/lawyers/entities/user.entity';
import { IAuthRepository } from '../repositories/auth.repository.interface';

export interface LoginInput {
  loginUserDto: LoginUserDto;
}

export interface LoginOutput {
  ok: boolean;
  user: User;
  token: string;
  refreshToken: string;
}

@Injectable()
export class LoginUseCase implements IUseCase<LoginInput, LoginOutput> {
  constructor(
    @Inject('IAuthRepository')
    private readonly authRepository: IAuthRepository,
    private readonly usersService: LawyersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async execute({ loginUserDto }: LoginInput): Promise<LoginOutput> {
    const user = (await this.usersService.login(loginUserDto)) as User;

    const refreshToken = await this.generateRefreshToken(user.id);

    return {
      ok: true,
      user,
      token: this.getJwtToken({ uid: user.id, role: user.role }),
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

  private getJwtToken(payload: JwtPayload): string {
    return this.jwtService.sign(payload);
  }
}
