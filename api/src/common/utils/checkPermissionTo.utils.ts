import { Logger, UnauthorizedException } from '@nestjs/common';

const logger = new Logger('checkPermissionTo');

export const checkPermissionTo = (
  originalUserID: string,
  userIdInData: string,
) => {
  if (originalUserID !== userIdInData) {
    logger.error('No tienes permisos para realizar esta acción');
    throw new UnauthorizedException({ ok: false, msgCode: 'UT0001' });
  }
};
