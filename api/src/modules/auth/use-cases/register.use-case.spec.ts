import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RegisterUseCase } from './register.use-case';
import { LawyersService } from 'src/modules/lawyers/lawyers.service';
import { EmailVerificationService } from 'src/modules/email-verification/email-verification.service';
import { IAuthRepository } from '../repositories/auth.repository.interface';
import { ValidRoles } from '../interfaces/validRoles';

describe('RegisterUseCase', () => {
  let useCase: RegisterUseCase;
  let mockAuthRepo: jest.Mocked<Pick<IAuthRepository, 'saveRefreshToken'>>;
  let mockUsersService: jest.Mocked<Pick<LawyersService, 'create'>>;
  let mockEmailVerificationService: jest.Mocked<Pick<EmailVerificationService, 'createSignupVerification'>>;
  let mockConfigService: jest.Mocked<Pick<ConfigService, 'get'>>;

  const mockUser = {
    id: 'user-uuid-001',
    name: 'john doe',
    email: 'john@example.com',
    country: 'AR',
    timezone: 'America/Argentina/Buenos_Aires',
    active: true,
    role: ValidRoles.LAWYER,
    status: 'active' as any,
    emailVerifiedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    password: 'hashed-password',
    appointments: [],
    isNew: true,
  };

  const mockVerification = {
    verificationToken: 'verification-token-123',
    expiresAt: new Date(Date.now() + 3600000),
  };

  beforeEach(async () => {
    mockAuthRepo = {
      saveRefreshToken: jest.fn().mockResolvedValue({ id: 'rt-uuid' }),
    };

    mockUsersService = {
      create: jest.fn(),
    };

    mockEmailVerificationService = {
      createSignupVerification: jest.fn(),
    };

    mockConfigService = {
      get: jest.fn().mockReturnValue('7d'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RegisterUseCase,
        { provide: 'IAuthRepository', useValue: mockAuthRepo },
        { provide: LawyersService, useValue: mockUsersService },
        { provide: EmailVerificationService, useValue: mockEmailVerificationService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    useCase = module.get(RegisterUseCase);
  });

  it('should register a new user and return tokens', async () => {
    mockUsersService.create.mockResolvedValue(mockUser as any);
    mockEmailVerificationService.createSignupVerification.mockResolvedValue(mockVerification as any);

    const result = await useCase.execute({
      createUserDto: {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'Pass1234',
      } as any,
    });

    expect(result.ok).toBe(true);
    expect(result.msgCode).toBe('SE0040');
    expect(result.user).toBeDefined();
    expect(result.refreshToken).toBeDefined();
    expect(result.verificationToken).toBe('verification-token-123');
  });

  it('should throw SE0025 when email is already registered', async () => {
    mockUsersService.create.mockRejectedValue(
      new BadRequestException({ ok: false, msgCode: 'SE0025' }),
    );

    await expect(
      useCase.execute({
        createUserDto: {
          name: 'John Doe',
          email: 'john@example.com',
          password: 'Pass1234',
        } as any,
      }),
    ).rejects.toThrow(BadRequestException);

    try {
      await useCase.execute({
        createUserDto: {
          name: 'John Doe',
          email: 'john@example.com',
          password: 'Pass1234',
        } as any,
      });
    } catch (error: any) {
      expect(error.response.msgCode).toBe('SE0025');
    }
  });

  it('should create email verification for the new user', async () => {
    mockUsersService.create.mockResolvedValue(mockUser as any);
    mockEmailVerificationService.createSignupVerification.mockResolvedValue(mockVerification as any);

    await useCase.execute({
      createUserDto: {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'Pass1234',
      } as any,
    });

    expect(mockEmailVerificationService.createSignupVerification).toHaveBeenCalledWith(mockUser);
  });

  it('should generate a refresh token and save it', async () => {
    mockUsersService.create.mockResolvedValue(mockUser as any);
    mockEmailVerificationService.createSignupVerification.mockResolvedValue(mockVerification as any);

    const result = await useCase.execute({
      createUserDto: {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'Pass1234',
      } as any,
    });

    expect(result.refreshToken).toBeDefined();
    expect(typeof result.refreshToken).toBe('string');
    expect(mockAuthRepo.saveRefreshToken).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: mockUser.id,
        tokenHash: expect.any(String),
        expiresAt: expect.any(Date),
      }),
    );
  });
});
