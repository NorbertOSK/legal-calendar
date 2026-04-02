import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { RecoverPasswordUseCase } from './recover-password.use-case';
import { LawyersService } from 'src/modules/lawyers/lawyers.service';
import { EmailService } from 'src/modules/email/email.service';

describe('RecoverPasswordUseCase', () => {
  let useCase: RecoverPasswordUseCase;
  let mockUsersService: jest.Mocked<Pick<LawyersService, 'findOne'>>;
  let mockJwtService: jest.Mocked<Pick<JwtService, 'sign'>>;
  let mockConfigService: jest.Mocked<Pick<ConfigService, 'get'>>;
  let mockEmailService: jest.Mocked<Pick<EmailService, 'sendForgotPassword'>>;

  const mockUser = {
    id: 'user-uuid-001',
    name: 'john doe',
    email: 'john@example.com',
    active: true,
  };

  beforeEach(async () => {
    mockUsersService = {
      findOne: jest.fn(),
    };

    mockJwtService = {
      sign: jest.fn().mockReturnValue('reset-jwt-token'),
    };

    mockConfigService = {
      get: jest.fn().mockImplementation((key: string) => {
        const config: Record<string, string> = {
          dashboardDomain: 'https://app.example.com',
          jwtForgetPasswordExpireIn: '1h',
          forgotPasswordJwtSecret: 'forgot-secret',
        };
        return config[key];
      }),
    };

    mockEmailService = {
      sendForgotPassword: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RecoverPasswordUseCase,
        { provide: LawyersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: EmailService, useValue: mockEmailService },
      ],
    }).compile();

    useCase = module.get(RecoverPasswordUseCase);
  });

  it('should send forgot-password email and return SE0001', async () => {
    mockUsersService.findOne.mockResolvedValue(mockUser as any);

    const result = await useCase.execute({
      forgotPasswordDto: { email: 'john@example.com' },
    });

    expect(result.ok).toBe(true);
    expect(result.msgCode).toBe('SE0001');
    expect(mockUsersService.findOne).toHaveBeenCalledWith('john@example.com');
    expect(mockEmailService.sendForgotPassword).toHaveBeenCalledWith(
      mockUser.email,
      mockUser.name,
      expect.stringContaining('reset-jwt-token'),
    );
  });

  it('should throw ST0002 when user is inactive', async () => {
    mockUsersService.findOne.mockResolvedValue({ ...mockUser, active: false } as any);

    await expect(
      useCase.execute({
        forgotPasswordDto: { email: 'john@example.com' },
      }),
    ).rejects.toThrow(UnauthorizedException);

    try {
      await useCase.execute({
        forgotPasswordDto: { email: 'john@example.com' },
      });
    } catch (error: any) {
      expect(error.response.msgCode).toBe('ST0002');
    }
  });
});
