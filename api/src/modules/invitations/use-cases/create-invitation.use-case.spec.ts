import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CreateInvitationUseCase } from './create-invitation.use-case';
import { IInvitationsRepository } from '../repositories/invitations.repository.interface';
import { LawyersService } from 'src/modules/lawyers/service/lawyers.service';
import { EmailService } from 'src/modules/email/email.service';
import { AdminInvitation } from '../entities/admin-invitation.entity';
import { User } from 'src/modules/lawyers/entities/user.entity';
import { ValidRoles } from 'src/modules/auth/interfaces/validRoles';
import { UserStatus } from 'src/modules/lawyers/entities/user.entity';

describe('CreateInvitationUseCase', () => {
  let useCase: CreateInvitationUseCase;
  let mockRepo: jest.Mocked<IInvitationsRepository>;
  let mockLawyersService: jest.Mocked<Pick<LawyersService, 'findOne'>>;
  let mockEmailService: jest.Mocked<Pick<EmailService, 'sendInvitation'>>;
  let mockConfigService: jest.Mocked<Pick<ConfigService, 'get'>>;

  const makeUser = (overrides: Partial<User> = {}): User => ({
    id: 'user-uuid-001',
    name: 'admin user',
    email: 'admin@example.com',
    country: null,
    timezone: 'America/Argentina/Buenos_Aires',
    password: 'hashed',
    active: true,
    role: ValidRoles.ADMIN,
    status: UserStatus.ACTIVE,
    emailVerifiedAt: new Date(),
    appointments: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });

  const makeInvitation = (overrides: Partial<AdminInvitation> = {}): AdminInvitation => ({
    id: 'inv-uuid-001',
    email: 'invited@example.com',
    invitedById: 'user-uuid-001',
    invitedBy: null as any,
    token: 'some-token',
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
      findOne: jest.fn(),
    };

    mockEmailService = {
      sendInvitation: jest.fn(),
    };

    mockConfigService = {
      get: jest.fn().mockReturnValue('https://dashboard.example.com'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateInvitationUseCase,
        { provide: 'IInvitationsRepository', useValue: mockRepo },
        { provide: LawyersService, useValue: mockLawyersService },
        { provide: EmailService, useValue: mockEmailService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    useCase = module.get(CreateInvitationUseCase);
  });

  it('should create invitation and send email', async () => {
    const invitedBy = makeUser();
    const savedInvitation = makeInvitation();

    mockLawyersService.findOne.mockRejectedValue(new Error('Not found'));
    mockRepo.findPendingByEmail.mockResolvedValue(null);
    mockRepo.save.mockResolvedValue(savedInvitation);

    const result = await useCase.execute({ email: 'invited@example.com', invitedBy });

    expect(result).toBe(savedInvitation);
    expect(mockRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'invited@example.com',
        invitedById: invitedBy.id,
      }),
    );
    expect(mockEmailService.sendInvitation).toHaveBeenCalledWith(
      'invited@example.com',
      invitedBy.name,
      expect.stringContaining('https://dashboard.example.com/auth/register-invited?token='),
    );
  });

  it('should throw INV0001 when email is already a registered user', async () => {
    const invitedBy = makeUser();
    const existingUser = makeUser({ email: 'existing@example.com' });

    mockLawyersService.findOne.mockResolvedValue(existingUser);

    await expect(
      useCase.execute({ email: 'existing@example.com', invitedBy }),
    ).rejects.toThrow(ConflictException);

    try {
      await useCase.execute({ email: 'existing@example.com', invitedBy });
    } catch (error: any) {
      expect(error.response.msgCode).toBe('INV0001');
    }
  });

  it('should throw INV0002 when pending invitation already exists', async () => {
    const invitedBy = makeUser();
    const pendingInvitation = makeInvitation({
      email: 'pending@example.com',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    mockLawyersService.findOne.mockRejectedValue(new Error('Not found'));
    mockRepo.findPendingByEmail.mockResolvedValue(pendingInvitation);

    await expect(
      useCase.execute({ email: 'pending@example.com', invitedBy }),
    ).rejects.toThrow(ConflictException);

    try {
      await useCase.execute({ email: 'pending@example.com', invitedBy });
    } catch (error: any) {
      expect(error.response.msgCode).toBe('INV0002');
    }
  });
});
