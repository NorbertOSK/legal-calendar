import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { DeleteAccountUseCase } from './delete-account.use-case';
import { ILawyersRepository } from '../repositories/lawyers.repository.interface';
import { RedisService } from '../../redis/redis.service';
import { User, UserStatus } from '../entities/user.entity';
import { ValidRoles } from '../../auth/interfaces/validRoles';

describe('DeleteAccountUseCase', () => {
  let useCase: DeleteAccountUseCase;
  let mockRepo: jest.Mocked<Pick<ILawyersRepository, 'findById' | 'findByEmail' | 'update'>>;
  let mockRedis: jest.Mocked<Pick<RedisService, 'deleteUserProfileCache'>>;

  const userId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

  const makeUser = (overrides: Partial<User> = {}): User => ({
    id: userId,
    name: 'john lawyer',
    email: 'lawyer@example.com',
    country: 'AR',
    timezone: 'America/Argentina/Buenos_Aires',
    password: 'hashed-password',
    active: true,
    role: ValidRoles.LAWYER,
    status: UserStatus.ACTIVE,
    emailVerifiedAt: new Date(),
    appointments: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });

  beforeEach(async () => {
    mockRepo = {
      findById: jest.fn(),
      findByEmail: jest.fn(),
      update: jest.fn(),
    };

    mockRedis = {
      deleteUserProfileCache: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeleteAccountUseCase,
        { provide: 'ILawyersRepository', useValue: mockRepo },
        { provide: RedisService, useValue: mockRedis },
      ],
    }).compile();

    useCase = module.get(DeleteAccountUseCase);
  });

  it('should anonymize email, deactivate user, and return GEN0004', async () => {
    const user = makeUser();
    mockRepo.findById.mockResolvedValue(user);
    mockRepo.update.mockResolvedValue(makeUser({ active: false, status: UserStatus.SUSPENDED }));
    mockRedis.deleteUserProfileCache.mockResolvedValue(undefined);

    const result = await useCase.execute({ userId });

    expect(result.ok).toBe(true);
    expect(result.msgCode).toBe('GEN0004');
    expect(mockRepo.update).toHaveBeenCalledWith(
      userId,
      expect.objectContaining({
        email: expect.stringContaining('DEL_'),
        active: false,
        status: UserStatus.SUSPENDED,
      }),
    );
  });

  it('should throw SE0006 when user not found', async () => {
    mockRepo.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({ userId }),
    ).rejects.toThrow(NotFoundException);

    try {
      await useCase.execute({ userId });
    } catch (error: any) {
      expect(error.response.msgCode).toBe('SE0006');
    }
  });

  it('should throw ST0002 when user is inactive', async () => {
    const inactiveUser = makeUser({ active: false });
    mockRepo.findById.mockResolvedValue(inactiveUser);

    await expect(
      useCase.execute({ userId }),
    ).rejects.toThrow(NotFoundException);

    try {
      await useCase.execute({ userId });
    } catch (error: any) {
      expect(error.response.msgCode).toBe('ST0002');
    }
  });

  it('should clean cache after deleting account', async () => {
    const user = makeUser();
    mockRepo.findById.mockResolvedValue(user);
    mockRepo.update.mockResolvedValue(makeUser({ active: false }));
    mockRedis.deleteUserProfileCache.mockResolvedValue(undefined);

    await useCase.execute({ userId });

    expect(mockRedis.deleteUserProfileCache).toHaveBeenCalledWith(userId);
  });
});
