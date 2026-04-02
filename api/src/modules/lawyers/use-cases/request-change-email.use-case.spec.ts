import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { RequestChangeEmailUseCase } from './request-change-email.use-case';
import { ILawyersRepository } from '../repositories/lawyers.repository.interface';
import { EmailVerificationService } from '../../email-verification/email-verification.service';
import { User, UserStatus } from '../entities/user.entity';
import { ValidRoles } from '../../auth/interfaces/validRoles';

describe('RequestChangeEmailUseCase', () => {
  let useCase: RequestChangeEmailUseCase;
  let mockRepo: jest.Mocked<Pick<ILawyersRepository, 'findById' | 'findByEmail'>>;
  let mockEmailVerification: jest.Mocked<Pick<EmailVerificationService, 'createChangeEmailVerification'>>;

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
      findByEmail: jest.fn(),
    };

    mockEmailVerification = {
      createChangeEmailVerification: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RequestChangeEmailUseCase,
        { provide: 'ILawyersRepository', useValue: mockRepo },
        { provide: EmailVerificationService, useValue: mockEmailVerification },
      ],
    }).compile();

    useCase = module.get(RequestChangeEmailUseCase);
  });

  it('should create change-email verification and return SE0040', async () => {
    const user = makeUser();
    const expiresAt = new Date();
    mockRepo.findById.mockResolvedValue(user);
    mockRepo.findByEmail.mockResolvedValue(null);
    mockEmailVerification.createChangeEmailVerification.mockResolvedValue({
      verificationToken: 'token-123',
      expiresAt,
    } as any);

    const result = await useCase.execute({ userId, newEmail: 'new@example.com' });

    expect(result.ok).toBe(true);
    expect(result.msgCode).toBe('SE0040');
    expect(result.verificationToken).toBe('token-123');
    expect(result.expiresAt).toBe(expiresAt);
    expect(mockEmailVerification.createChangeEmailVerification).toHaveBeenCalledWith(
      user,
      'new@example.com',
    );
  });

  it('should throw VAL0022 when new email is same as current', async () => {
    const user = makeUser({ email: 'lawyer@example.com' });
    mockRepo.findById.mockResolvedValue(user);

    await expect(
      useCase.execute({ userId, newEmail: 'lawyer@example.com' }),
    ).rejects.toThrow(BadRequestException);

    try {
      await useCase.execute({ userId, newEmail: 'lawyer@example.com' });
    } catch (error: any) {
      expect(error.response.msgCode).toBe('VAL0022');
    }
  });

  it('should throw SE0025 when email is already taken', async () => {
    const user = makeUser();
    const existingUser = makeUser({ id: 'other-user-uuid', email: 'taken@example.com' });
    mockRepo.findById.mockResolvedValue(user);
    mockRepo.findByEmail.mockResolvedValue(existingUser);

    await expect(
      useCase.execute({ userId, newEmail: 'taken@example.com' }),
    ).rejects.toThrow(BadRequestException);

    try {
      await useCase.execute({ userId, newEmail: 'taken@example.com' });
    } catch (error: any) {
      expect(error.response.msgCode).toBe('SE0025');
    }
  });

  it('should throw SE0006 when user not found', async () => {
    mockRepo.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({ userId, newEmail: 'new@example.com' }),
    ).rejects.toThrow(NotFoundException);

    try {
      await useCase.execute({ userId, newEmail: 'new@example.com' });
    } catch (error: any) {
      expect(error.response.msgCode).toBe('SE0006');
    }
  });
});
