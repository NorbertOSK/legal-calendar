import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/modules/lawyers/entities/user.entity';
import { JwtPayload } from '../interfaces';

@Injectable()
export class ForgotPasswordJwtStrategy extends PassportStrategy(
  Strategy,
  'forgot-password-jwt',
) {
  private readonly logger = new Logger('ForgotPasswordJwtStrategy');

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private configService: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromUrlQueryParameter('token'),
      ignoreExpiration: false,
      secretOrKey: configService.get('forgotPasswordJwtSecret'),
    });
  }

  async validate(payload: JwtPayload): Promise<User> {
    const { uid } = payload;

    const user = await this.userRepository.findOne({
      where: { id: uid },
      select: {
        id: true,
        email: true,
        role: true,
        name: true,
        active: true,
      },
    });

    if (!user) {
      this.logger.error(`Invalid token - User with ID ${uid} not found [ST0001]`);
      throw new UnauthorizedException({ ok: false, msgCode: 'ST0001' });
    }
    if (!user.active) {
      this.logger.error(`Inactive user: ${user.email} [ST0002]`);
      throw new UnauthorizedException({ ok: false, msgCode: 'ST0002' });
    }
    return user;
  }
}
