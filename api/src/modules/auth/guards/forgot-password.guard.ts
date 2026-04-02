import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { TokenExpiredError } from 'jsonwebtoken';

@Injectable()
export class ForgotPasswordAuthGuard extends AuthGuard('forgot-password-jwt') {
  private readonly logger = new Logger(ForgotPasswordAuthGuard.name);

  handleRequest(err: any, user: any, info: any) {
    if (info instanceof TokenExpiredError || info?.name === 'TokenExpiredError') {
      this.logger.warn(`Token de recuperación expirado [ST0003]`);
      throw new UnauthorizedException({ ok: false, msgCode: 'ST0003' });
    }

    if (err) {
      throw err;
    }

    if (!user) {
      throw new UnauthorizedException({ ok: false, msgCode: 'ST0001' });
    }

    return user;
  }
}

