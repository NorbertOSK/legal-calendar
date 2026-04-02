import { InjectRepository } from '@nestjs/typeorm';
import { PassportStrategy } from '@nestjs/passport';
import { Repository } from 'typeorm';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { User, UserStatus } from '../../lawyers/entities/user.entity';
import { ConfigService } from '@nestjs/config';
import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtPayload } from '../interfaces';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger('JwtStrategy');

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly configService: ConfigService,
  ) {
    super({
      secretOrKey: configService.get('jwtSecret'),
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
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
        status: true,
        active: true,
        emailVerifiedAt: true,
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
    if (user.status === UserStatus.SUSPENDED) {
      this.logger.error(`Suspended user: ${user.email} [ST0004]`);
      throw new UnauthorizedException({ ok: false, msgCode: 'ST0004' });
    }
    if (!user.emailVerifiedAt) {
      this.logger.error(`User with unverified email: ${user.email} [SE0044]`);
      throw new UnauthorizedException({ ok: false, msgCode: 'SE0044' });
    }

    return user;
  }
}
