import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { UpdateLawyerProfileUseCase } from './update-lawyer-profile.use-case';
import { ILawyersRepository } from '../repositories/lawyers.repository.interface';
import { RedisService } from '../../redis/redis.service';
import { User, UserStatus } from '../entities/user.entity';
import { ValidRoles } from '../../auth/interfaces/validRoles';

describe('UpdateLawyerProfileUseCase', () => {
  let useCase: UpdateLawyerProfileUseCase;
  let mockRepo: jest.Mocked<Pick<ILawyersRepository, 'findById' | 'update'>>;
  let mockRedis: jest.Mocked<Pick<RedisService, 'deleteUserProfileCache'>>;

  const userId = 'user-uuid-001';

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
      update: jest.fn(),
    };

    mockRedis = {
      deleteUserProfileCache: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateLawyerProfileUseCase,
        { provide: 'ILawyersRepository', useValue: mockRepo },
        { provide: RedisService, useValue: mockRedis },
      ],
    }).compile();

    useCase = module.get(UpdateLawyerProfileUseCase);
  });

  it('should update name, country, and timezone successfully', async () => {
    const existing = makeUser();
    const updated = makeUser({ name: 'jane updated', country: 'US', timezone: 'America/New_York' });
    mockRepo.findById.mockResolvedValue(existing);
    mockRepo.update.mockResolvedValue(updated);
    mockRedis.deleteUserProfileCache.mockResolvedValue(undefined);

    const result = await useCase.execute({
      userId,
      dto: { name: 'Jane Updated', country: 'US', timezone: 'America/New_York' },
    });

    expect(result.ok).toBe(true);
    expect(result.msgCode).toBe('GEN0003');
    expect(result.user).not.toHaveProperty('createdAt');
    expect(result.user).not.toHaveProperty('updatedAt');
    expect(mockRepo.update).toHaveBeenCalledWith(userId, {
      name: 'jane updated',
      country: 'US',
      timezone: 'America/New_York',
    });
  });

  it('should return GEN0003 without updating when no valid fields provided', async () => {
    const existing = makeUser();
    mockRepo.findById.mockResolvedValue(existing);

    const result = await useCase.execute({ userId, dto: {} });

    expect(result.ok).toBe(true);
    expect(result.msgCode).toBe('GEN0003');
    expect(mockRepo.update).not.toHaveBeenCalled();
  });

  it('should throw SE0006 when user not found', async () => {
    mockRepo.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({ userId, dto: { name: 'Test' } }),
    ).rejects.toThrow(NotFoundException);

    try {
      await useCase.execute({ userId, dto: { name: 'Test' } });
    } catch (error: any) {
      expect(error.response.msgCode).toBe('SE0006');
    }
  });

  it('should invalidate cache after update', async () => {
    const existing = makeUser();
    const updated = makeUser({ name: 'new name' });
    mockRepo.findById.mockResolvedValue(existing);
    mockRepo.update.mockResolvedValue(updated);
    mockRedis.deleteUserProfileCache.mockResolvedValue(undefined);

    await useCase.execute({ userId, dto: { name: 'New Name' } });

    expect(mockRedis.deleteUserProfileCache).toHaveBeenCalledWith(userId);
  });
});
