import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { RegisterInvitedUseCase } from './register-invited.use-case';
import { IInvitationsRepository } from '../repositories/invitations.repository.interface';
import { LawyersService } from 'src/modules/lawyers/service/lawyers.service';
import { AdminInvitation } from '../entities/admin-invitation.entity';
import { User } from 'src/modules/lawyers/entities/user.entity';
import { ValidRoles } from 'src/modules/auth/interfaces/validRoles';
import { UserStatus } from 'src/modules/lawyers/entities/user.entity';

describe('RegisterInvitedUseCase', () => {
  let useCase: RegisterInvitedUseCase;
  let mockRepo: jest.Mocked<IInvitationsRepository>;
  let mockLawyersService: jest.Mocked<Pick<LawyersService, 'create'>>;

  const makeUser = (overrides: Partial<User> = {}): User => ({
    id: 'user-uuid-001',
    name: 'invited user',
    email: 'invited@example.com',
    country: null,
    timezone: 'America/Argentina/Buenos_Aires',
    password: 'hashed',
    active: true,
    role: ValidRoles.LAWYER,
    status: UserStatus.ACTIVE,
    emailVerifiedAt: null,
    appointments: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });

  const makeInvitation = (overrides: Partial<AdminInvitation> = {}): AdminInvitation => ({
    id: 'inv-uuid-001',
    email: 'invited@example.com',
    invitedById: 'admin-uuid-001',
    invitedBy: null as any,
    token: 'valid-token',
    expiresAt: new Date(Date.now() + 72 * 60 * 60 * 1000),
    acceptedAt: null,
    createdAt: new Date(),
    ...overrides,
  });

  beforeEach(async () => {
    mockRepo = {
      findByToken: jest.fn(),
      findByEmail: jest.fn(),
      findPendingByEmail: jest.fn(),
      save: jest.fn(),
      findAll: jest.fn(),
      findById: jest.fn(),
    };

    mockLawyersService = {
      create: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RegisterInvitedUseCase,
        { provide: 'IInvitationsRepository', useValue: mockRepo },
        { provide: LawyersService, useValue: mockLawyersService },
      ],
    }).compile();

    useCase = module.get(RegisterInvitedUseCase);
  });

  it('should validate token, create user with LAWYER role, and mark invitation as accepted', async () => {
    const invitation = makeInvitation();
    const createdUser = makeUser();

    mockRepo.findByToken.mockResolvedValue(invitation);
    mockLawyersService.create.mockResolvedValue(createdUser);
    mockRepo.save.mockResolvedValue(invitation);

    const result = await useCase.execute({
      token: 'valid-token',
      userData: { name: 'Invited User', password: 'securePass123' },
    });

    expect(result).toBe(createdUser);
    expect(mockRepo.findByToken).toHaveBeenCalledWith('valid-token');
    expect(mockLawyersService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        email: invitation.email,
        name: 'Invited User',
        password: 'securePass123',
        role: ValidRoles.LAWYER,
        active: true,
      }),
      expect.objectContaining({
        emailVerifiedAt: expect.any(Date),
      }),
    );
    expect(mockRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        acceptedAt: expect.any(Date),
      }),
    );
  });

  it('should throw INV0005 when token is invalid', async () => {
    mockRepo.findByToken.mockResolvedValue(null);

    await expect(
      useCase.execute({
        token: 'invalid-token',
        userData: { name: 'Test', password: 'pass123' },
      }),
    ).rejects.toThrow(BadRequestException);

    try {
      await useCase.execute({
        token: 'invalid-token',
        userData: { name: 'Test', password: 'pass123' },
      });
    } catch (error: any) {
      expect(error.response.msgCode).toBe('INV0005');
    }
  });

  it('should throw INV0004 when invitation is already accepted', async () => {
    const invitation = makeInvitation({ acceptedAt: new Date() });

    mockRepo.findByToken.mockResolvedValue(invitation);

    await expect(
      useCase.execute({
        token: 'valid-token',
        userData: { name: 'Test', password: 'pass123' },
      }),
    ).rejects.toThrow(BadRequestException);

    try {
      await useCase.execute({
        token: 'valid-token',
        userData: { name: 'Test', password: 'pass123' },
      });
    } catch (error: any) {
      expect(error.response.msgCode).toBe('INV0004');
    }
  });

  it('should throw INV0006 when invitation is expired', async () => {
    const invitation = makeInvitation({
      expiresAt: new Date(Date.now() - 1000),
    });

    mockRepo.findByToken.mockResolvedValue(invitation);

    await expect(
      useCase.execute({
        token: 'valid-token',
        userData: { name: 'Test', password: 'pass123' },
      }),
    ).rejects.toThrow(BadRequestException);

    try {
      await useCase.execute({
        token: 'valid-token',
        userData: { name: 'Test', password: 'pass123' },
      });
    } catch (error: any) {
      expect(error.response.msgCode).toBe('INV0006');
    }
  });
});
