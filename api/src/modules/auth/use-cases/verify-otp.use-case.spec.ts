import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { VerifyOtpUseCase } from './verify-otp.use-case';
import { EmailVerificationService } from 'src/modules/email-verification/email-verification.service';
import { EmailService } from 'src/modules/email/email.service';
import { IAuthRepository } from '../repositories/auth.repository.interface';
import { EmailVerificationPurpose } from 'src/modules/email-verification/enums/email-verification-purpose.enum';
import { ValidRoles } from '../interfaces/validRoles';

describe('VerifyOtpUseCase', () => {
  let useCase: VerifyOtpUseCase;
  let mockAuthRepo: jest.Mocked<Pick<IAuthRepository, 'findUserById'>>;
  let mockEmailVerificationService: jest.Mocked<Pick<EmailVerificationService, 'verifyCode'>>;
  let mockEmailService: jest.Mocked<Pick<EmailService, 'sendWelcome'>>;
  let mockJwtService: jest.Mocked<Pick<JwtService, 'sign' | 'verify'>>;
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
    emailVerifiedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    password: 'hashed-password',
    appointments: [],
  };

  beforeEach(async () => {
    mockAuthRepo = {
      findUserById: jest.fn(),
    };

    mockEmailVerificationService = {
      verifyCode: jest.fn(),
    };

    mockEmailService = {
      sendWelcome: jest.fn(),
    };

    mockJwtService = {
      sign: jest.fn().mockReturnValue('jwt-token'),
      verify: jest.fn(),
    };

    mockConfigService = {
      get: jest.fn().mockReturnValue('secret'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VerifyOtpUseCase,
        { provide: 'IAuthRepository', useValue: mockAuthRepo },
        { provide: EmailVerificationService, useValue: mockEmailVerificationService },
        { provide: EmailService, useValue: mockEmailService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    useCase = module.get(VerifyOtpUseCase);
  });

  it('should verify signup, mark user as new, send welcome email, and return SE0039', async () => {
    mockEmailVerificationService.verifyCode.mockResolvedValue({
      userId: mockUser.id,
    } as any);
    mockAuthRepo.findUserById.mockResolvedValue(mockUser as any);

    const result = await useCase.execute({
      verifyEmailDto: {
        purpose: EmailVerificationPurpose.SIGNUP,
        verificationToken: 'token-123',
        securityCode: '123456',
      },
    });

    expect(result.ok).toBe(true);
    expect(result.msgCode).toBe('SE0039');
    expect(result.token).toBe('jwt-token');
    expect(result.user).toBeDefined();
    expect(mockEmailService.sendWelcome).toHaveBeenCalledWith(mockUser.email, mockUser.name);
    expect(mockEmailVerificationService.verifyCode).toHaveBeenCalledWith(
      EmailVerificationPurpose.SIGNUP,
      'token-123',
      '123456',
      undefined,
    );
  });

  it('should verify change-email flow and return GEN0003', async () => {
    mockJwtService.verify.mockReturnValue({ uid: 'requester-uuid' });
    mockAuthRepo.findUserById
      .mockResolvedValueOnce({ id: 'requester-uuid', active: true } as any)
      .mockResolvedValueOnce(mockUser as any);
    mockEmailVerificationService.verifyCode.mockResolvedValue({
      userId: mockUser.id,
    } as any);

    const result = await useCase.execute({
      verifyEmailDto: {
        purpose: EmailVerificationPurpose.CHANGE_EMAIL,
        verificationToken: 'token-456',
        securityCode: '654321',
      },
      authToken: 'valid-auth-token',
    });

    expect(result.ok).toBe(true);
    expect(result.msgCode).toBe('GEN0003');
    expect(result.token).toBeUndefined();
    expect(mockEmailService.sendWelcome).not.toHaveBeenCalled();
  });

  it('should throw SE0006 when user not found after verification', async () => {
    mockEmailVerificationService.verifyCode.mockResolvedValue({
      userId: 'non-existent-uuid',
    } as any);
    mockAuthRepo.findUserById.mockResolvedValue(null);

    await expect(
      useCase.execute({
        verifyEmailDto: {
          purpose: EmailVerificationPurpose.SIGNUP,
          verificationToken: 'token-123',
          securityCode: '123456',
        },
      }),
    ).rejects.toThrow(NotFoundException);

    try {
      await useCase.execute({
        verifyEmailDto: {
          purpose: EmailVerificationPurpose.SIGNUP,
          verificationToken: 'token-123',
          securityCode: '123456',
        },
      });
    } catch (error: any) {
      expect(error.response.msgCode).toBe('SE0006');
    }
  });

  it('should throw ST0001 when auth token is missing for change-email', async () => {
    await expect(
      useCase.execute({
        verifyEmailDto: {
          purpose: EmailVerificationPurpose.CHANGE_EMAIL,
          verificationToken: 'token-456',
          securityCode: '654321',
        },
      }),
    ).rejects.toThrow(UnauthorizedException);

    try {
      await useCase.execute({
        verifyEmailDto: {
          purpose: EmailVerificationPurpose.CHANGE_EMAIL,
          verificationToken: 'token-456',
          securityCode: '654321',
        },
      });
    } catch (error: any) {
      expect(error.response.msgCode).toBe('ST0001');
    }
  });
});
