import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';

import { User, UserStatus } from 'src/modules/lawyers/entities/user.entity';
import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let userRepository: Partial<Repository<User>>;

  beforeEach(() => {
    userRepository = {
      findOne: jest.fn(),
    };

    strategy = new JwtStrategy(
      userRepository as Repository<User>,
      {
        get: jest.fn().mockReturnValue('jwt-secret'),
      } as unknown as ConfigService,
    );
  });

  it('rejects suspended users during jwt validation', async () => {
    (userRepository.findOne as jest.Mock).mockResolvedValue({
      id: 'user-id',
      email: 'suspended@example.com',
      role: 'user',
      name: 'Suspended',
      status: UserStatus.SUSPENDED,
      active: true,
      emailVerifiedAt: new Date(),
    });

    await expect(strategy.validate({ uid: 'user-id', role: 'user' as any })).rejects.toEqual(
      expect.objectContaining({
        response: expect.objectContaining({
          msgCode: 'ST0004',
        }),
      }),
    );
  });
});
