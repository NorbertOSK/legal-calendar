import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { RefreshTokenUseCase } from './refresh-token.use-case';
import { IAuthRepository } from '../repositories/auth.repository.interface';
import { UserStatus } from 'src/modules/lawyers/entities/user.entity';
import { ValidRoles } from '../interfaces/validRoles';

describe('RefreshTokenUseCase', () => {
  let useCase: RefreshTokenUseCase;
  let mockAuthRepo: jest.Mocked<Pick<IAuthRepository, 'findRefreshTokenByHash' | 'deleteRefreshToken' | 'saveRefreshToken'>>;
  let mockJwtService: jest.Mocked<Pick<JwtService, 'sign'>>;
  let mockConfigService: jest.Mocked<Pick<ConfigService, 'get'>>;

  const mockUser = {
    id: 'user-uuid-001',
    name: 'john doe',
    email: 'john@example.com',
    active: true,
    role: ValidRoles.LAWYER,
    status: UserStatus.ACTIVE,
    emailVerifiedAt: new Date(),
  };

  const mockRefreshTokenEntity = {
    id: 'rt-uuid-001',
    userId: mockUser.id,
    tokenHash: 'existing-hash',
    expiresAt: new Date(Date.now() + 86400000),
    revokedAt: null,
    createdAt: new Date(),
    user: mockUser,
  };

  beforeEach(async () => {
    mockAuthRepo = {
      findRefreshTokenByHash: jest.fn(),
      deleteRefreshToken: jest.fn().mockResolvedValue(undefined),
      saveRefreshToken: jest.fn().mockResolvedValue({ id: 'new-rt-uuid' }),
    };

    mockJwtService = {
      sign: jest.fn().mockReturnValue('new-jwt-token'),
    };

    mockConfigService = {
      get: jest.fn().mockReturnValue('7d'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RefreshTokenUseCase,
        { provide: 'IAuthRepository', useValue: mockAuthRepo },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    useCase = module.get(RefreshTokenUseCase);
  });

  it('should rotate token and return new access + refresh tokens', async () => {
    mockAuthRepo.findRefreshTokenByHash.mockResolvedValue(mockRefreshTokenEntity as any);

    const result = await useCase.execute({ refreshToken: 'raw-token-value' });

    expect(result.ok).toBe(true);
    expect(result.token).toBe('new-jwt-token');
    expect(result.refreshToken).toBeDefined();
    expect(typeof result.refreshToken).toBe('string');
    expect(mockAuthRepo.deleteRefreshToken).toHaveBeenCalledWith(mockRefreshTokenEntity);
    expect(mockAuthRepo.saveRefreshToken).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: mockUser.id,
        tokenHash: expect.any(String),
        expiresAt: expect.any(Date),
      }),
    );
  });

  it('should throw ST0001 when token not found', async () => {
    mockAuthRepo.findRefreshTokenByHash.mockResolvedValue(null);

    await expect(
      useCase.execute({ refreshToken: 'invalid-token' }),
    ).rejects.toThrow(UnauthorizedException);

    try {
      await useCase.execute({ refreshToken: 'invalid-token' });
    } catch (error: any) {
      expect(error.response.msgCode).toBe('ST0001');
    }
  });

  it('should throw ST0001 when token is expired', async () => {
    mockAuthRepo.findRefreshTokenByHash.mockResolvedValue({
      ...mockRefreshTokenEntity,
      expiresAt: new Date(Date.now() - 86400000),
    } as any);

    await expect(
      useCase.execute({ refreshToken: 'expired-token' }),
    ).rejects.toThrow(UnauthorizedException);

    try {
      await useCase.execute({ refreshToken: 'expired-token' });
    } catch (error: any) {
      expect(error.response.msgCode).toBe('ST0001');
    }
  });

  it('should throw ST0002 when user is inactive', async () => {
    mockAuthRepo.findRefreshTokenByHash.mockResolvedValue({
      ...mockRefreshTokenEntity,
      user: { ...mockUser, active: false },
    } as any);

    await expect(
      useCase.execute({ refreshToken: 'raw-token-value' }),
    ).rejects.toThrow(UnauthorizedException);

    try {
      await useCase.execute({ refreshToken: 'raw-token-value' });
    } catch (error: any) {
      expect(error.response.msgCode).toBe('ST0002');
    }
  });

  it('should throw ST0004 when user is suspended', async () => {
    mockAuthRepo.findRefreshTokenByHash.mockResolvedValue({
      ...mockRefreshTokenEntity,
      user: { ...mockUser, status: UserStatus.SUSPENDED },
    } as any);

    await expect(
      useCase.execute({ refreshToken: 'raw-token-value' }),
    ).rejects.toThrow(UnauthorizedException);

    try {
      await useCase.execute({ refreshToken: 'raw-token-value' });
    } catch (error: any) {
      expect(error.response.msgCode).toBe('ST0004');
    }
  });

  it('should throw SE0044 when email is not verified', async () => {
    mockAuthRepo.findRefreshTokenByHash.mockResolvedValue({
      ...mockRefreshTokenEntity,
      user: { ...mockUser, emailVerifiedAt: null },
    } as any);

    await expect(
      useCase.execute({ refreshToken: 'raw-token-value' }),
    ).rejects.toThrow(UnauthorizedException);

    try {
      await useCase.execute({ refreshToken: 'raw-token-value' });
    } catch (error: any) {
      expect(error.response.msgCode).toBe('SE0044');
    }
  });
});
