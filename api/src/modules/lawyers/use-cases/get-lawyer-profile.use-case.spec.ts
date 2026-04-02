import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { GetLawyerProfileUseCase } from './get-lawyer-profile.use-case';
import { ILawyersRepository } from '../repositories/lawyers.repository.interface';
import { RedisService } from '../../redis/redis.service';
import { User, UserStatus } from '../entities/user.entity';
import { ValidRoles } from '../../auth/interfaces/validRoles';

describe('GetLawyerProfileUseCase', () => {
  let useCase: GetLawyerProfileUseCase;
  let mockRepo: jest.Mocked<Pick<ILawyersRepository, 'findById'>>;
  let mockRedis: jest.Mocked<Pick<RedisService, 'get' | 'set' | 'generateUserProfileKey'>>;

  const userId = 'user-uuid-001';
  const userEmail = 'lawyer@example.com';

  const makeUser = (overrides: Partial<User> = {}): User => ({
    id: userId,
    name: 'john lawyer',
    email: userEmail,
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
    };

    mockRedis = {
      get: jest.fn(),
      set: jest.fn(),
      generateUserProfileKey: jest.fn().mockReturnValue(`user:profile:${userId}`),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetLawyerProfileUseCase,
        { provide: 'ILawyersRepository', useValue: mockRepo },
        { provide: RedisService, useValue: mockRedis },
      ],
    }).compile();

    useCase = module.get(GetLawyerProfileUseCase);
  });

  it('should return profile from cache when cache hit', async () => {
    const cachedProfile = { id: userId, name: 'john lawyer', email: userEmail };
    mockRedis.get.mockResolvedValue(cachedProfile as any);

    const result = await useCase.execute({ userId, userEmail });

    expect(result).toEqual({ ok: true, myProfile: cachedProfile });
    expect(mockRedis.get).toHaveBeenCalledWith(`user:profile:${userId}`);
    expect(mockRepo.findById).not.toHaveBeenCalled();
  });

  it('should query DB on cache miss, cache result, and return', async () => {
    const user = makeUser();
    mockRedis.get.mockResolvedValue(null);
    mockRepo.findById.mockResolvedValue(user);
    mockRedis.set.mockResolvedValue(undefined);

    const result = await useCase.execute({ userId, userEmail });

    expect(result.ok).toBe(true);
    expect(result.myProfile).not.toHaveProperty('createdAt');
    expect(result.myProfile).not.toHaveProperty('updatedAt');
    expect(mockRepo.findById).toHaveBeenCalledWith(userId);
    expect(mockRedis.set).toHaveBeenCalledWith(
      `user:profile:${userId}`,
      expect.objectContaining({ id: userId }),
      7 * 24 * 60 * 60,
    );
  });

  it('should throw SE0006 when user not found', async () => {
    mockRedis.get.mockResolvedValue(null);
    mockRepo.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({ userId, userEmail }),
    ).rejects.toThrow(NotFoundException);

    try {
      await useCase.execute({ userId, userEmail });
    } catch (error: any) {
      expect(error.response.msgCode).toBe('SE0006');
    }
  });
});
