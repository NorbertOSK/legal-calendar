import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { User } from '../../lawyers/entities/user.entity';
import { META_ROLES } from '../decorators';

@Injectable()
export class UserRoleGuard implements CanActivate {
  private readonly logger = new Logger('User Role Guard');
  constructor(private readonly reflector: Reflector) { }

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const validRoles: string[] = this.reflector.get(
      META_ROLES,
      context.getHandler(),
    );

    if (!validRoles) return true;
    if (validRoles.length === 0) return true;

    const req = context.switchToHttp().getRequest();
    const user = req.user as User;

    if (!user)
      throw new BadRequestException({ ok: false, msgCode: 'GU0001' });

    if (validRoles.includes(user.role)) {
      return true;
    }

    this.logger.warn(
      `User ${user.name} does not have the required role: [${validRoles}] [GU0002]`,
    );
    throw new ForbiddenException({ ok: false, msgCode: 'GU0002' });
  }
}
