import { BadRequestException, Logger } from '@nestjs/common';

const logger = new Logger('UsersService');

export const checkSameId = (idOne: string, idTwo: string) => {
  if (idOne === idTwo) {
    logger.error('User tried to perform action on themselves [UT0001]');
    throw new BadRequestException({ ok: false, msgCode: 'UT0001' });
  }
};
