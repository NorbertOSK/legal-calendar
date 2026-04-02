import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ToggleLawyerStatusUseCase } from './toggle-lawyer-status.use-case';
import { ILawyersRepository } from '../repositories/lawyers.repository.interface';
import { RedisService } from '../../redis/redis.service';
import { User, UserStatus } from '../entities/user.entity';
import { ValidRoles } from '../../auth/interfaces/validRoles';

describe('ToggleLawyerStatusUseCase', () => {
  let useCase: ToggleLawyerStatusUseCase;
  let mockRepo: jest.Mocked<Pick<ILawyersRepository, 'findById' | 'update'>>;
  let mockRedis: jest.Mocked<Pick<RedisService, 'deleteUserProfileCache'>>;

  const targetUserId = 'user-uuid-001';
  const adminId = 'admin-uuid-001';

  const makeUser = (overrides: Partial<User> = {}): User => ({
    id: targetUserId,
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
        ToggleLawyerStatusUseCase,
        { provide: 'ILawyersRepository', useValue: mockRepo },
        { provide: RedisService, useValue: mockRedis },
      ],
    }).compile();

    useCase = module.get(ToggleLawyerStatusUseCase);
  });

  it('should toggle active user to inactive with SUSPENDED status', async () => {
    const user = makeUser({ active: true, status: UserStatus.ACTIVE });
    const updated = makeUser({ active: false, status: UserStatus.SUSPENDED });
    mockRepo.findById.mockResolvedValue(user);
    mockRepo.update.mockResolvedValue(updated);
    mockRedis.deleteUserProfileCache.mockResolvedValue(undefined);

    const result = await useCase.execute({ targetUserId, adminId });

    expect(result.ok).toBe(true);
    expect(result.msgCode).toBe('GEN0003');
    expect(mockRepo.update).toHaveBeenCalledWith(targetUserId, {
      active: false,
      status: UserStatus.SUSPENDED,
    });
  });

  it('should toggle inactive user to active with ACTIVE status', async () => {
    const user = makeUser({ active: false, status: UserStatus.SUSPENDED });
    const updated = makeUser({ active: true, status: UserStatus.ACTIVE });
    mockRepo.findById.mockResolvedValue(user);
    mockRepo.update.mockResolvedValue(updated);
    mockRedis.deleteUserProfileCache.mockResolvedValue(undefined);

    const result = await useCase.execute({ targetUserId, adminId });

    expect(result.ok).toBe(true);
    expect(mockRepo.update).toHaveBeenCalledWith(targetUserId, {
      active: true,
      status: UserStatus.ACTIVE,
    });
  });

  it('should throw GU0003 when admin tries to toggle own status', async () => {
    await expect(
      useCase.execute({ targetUserId: adminId, adminId }),
    ).rejects.toThrow(BadRequestException);

    try {
      await useCase.execute({ targetUserId: adminId, adminId });
    } catch (error: any) {
      expect(error.response.msgCode).toBe('GU0003');
    }
  });

  it('should throw SE0006 when user not found', async () => {
    mockRepo.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({ targetUserId, adminId }),
    ).rejects.toThrow(NotFoundException);

    try {
      await useCase.execute({ targetUserId, adminId });
    } catch (error: any) {
      expect(error.response.msgCode).toBe('SE0006');
    }
  });

  it('should invalidate cache after toggling status', async () => {
    const user = makeUser({ active: true });
    const updated = makeUser({ active: false, status: UserStatus.SUSPENDED });
    mockRepo.findById.mockResolvedValue(user);
    mockRepo.update.mockResolvedValue(updated);
    mockRedis.deleteUserProfileCache.mockResolvedValue(undefined);

    await useCase.execute({ targetUserId, adminId });

    expect(mockRedis.deleteUserProfileCache).toHaveBeenCalledWith(targetUserId);
  });
});
