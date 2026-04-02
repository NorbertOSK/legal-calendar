import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { LoginUseCase } from './login.use-case';
import { LawyersService } from 'src/modules/lawyers/lawyers.service';
import { IAuthRepository } from '../repositories/auth.repository.interface';
import { ValidRoles } from '../interfaces/validRoles';

describe('LoginUseCase', () => {
  let useCase: LoginUseCase;
  let mockAuthRepo: jest.Mocked<Pick<IAuthRepository, 'saveRefreshToken'>>;
  let mockUsersService: jest.Mocked<Pick<LawyersService, 'login'>>;
  let mockJwtService: jest.Mocked<Pick<JwtService, 'sign'>>;
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
    password: undefined,
    appointments: [],
  };

  beforeEach(async () => {
    mockAuthRepo = {
      saveRefreshToken: jest.fn().mockResolvedValue({ id: 'rt-uuid' }),
    };

    mockUsersService = {
      login: jest.fn(),
    };

    mockJwtService = {
      sign: jest.fn().mockReturnValue('jwt-token'),
    };

    mockConfigService = {
      get: jest.fn().mockReturnValue('7d'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LoginUseCase,
        { provide: 'IAuthRepository', useValue: mockAuthRepo },
        { provide: LawyersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    useCase = module.get(LoginUseCase);
  });

  it('should return user and tokens on valid credentials', async () => {
    mockUsersService.login.mockResolvedValue(mockUser as any);

    const result = await useCase.execute({
      loginUserDto: { email: 'john@example.com', password: 'Pass1234' },
    });

    expect(result.ok).toBe(true);
    expect(result.user).toBeDefined();
    expect(result.token).toBe('jwt-token');
    expect(result.refreshToken).toBeDefined();
    expect(mockUsersService.login).toHaveBeenCalledWith({
      email: 'john@example.com',
      password: 'Pass1234',
    });
  });

  it('should throw SE0022 when email not found', async () => {
    mockUsersService.login.mockRejectedValue(
      new UnauthorizedException({ ok: false, msgCode: 'SE0022' }),
    );

    await expect(
      useCase.execute({
        loginUserDto: { email: 'unknown@example.com', password: 'Pass1234' },
      }),
    ).rejects.toThrow(UnauthorizedException);

    try {
      await useCase.execute({
        loginUserDto: { email: 'unknown@example.com', password: 'Pass1234' },
      });
    } catch (error: any) {
      expect(error.response.msgCode).toBe('SE0022');
    }
  });

  it('should throw SE0023 when password is incorrect', async () => {
    mockUsersService.login.mockRejectedValue(
      new UnauthorizedException({ ok: false, msgCode: 'SE0023' }),
    );

    await expect(
      useCase.execute({
        loginUserDto: { email: 'john@example.com', password: 'WrongPass' },
      }),
    ).rejects.toThrow(UnauthorizedException);

    try {
      await useCase.execute({
        loginUserDto: { email: 'john@example.com', password: 'WrongPass' },
      });
    } catch (error: any) {
      expect(error.response.msgCode).toBe('SE0023');
    }
  });

  it('should generate a refresh token and save it', async () => {
    mockUsersService.login.mockResolvedValue(mockUser as any);

    const result = await useCase.execute({
      loginUserDto: { email: 'john@example.com', password: 'Pass1234' },
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
