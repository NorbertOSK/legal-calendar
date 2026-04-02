import { Test, TestingModule } from '@nestjs/testing';
import { ResetPasswordUseCase } from './reset-password.use-case';
import { LawyersService } from 'src/modules/lawyers/lawyers.service';
import { EmailService } from 'src/modules/email/email.service';
import { IAuthRepository } from '../repositories/auth.repository.interface';
import { ValidRoles } from '../interfaces/validRoles';

describe('ResetPasswordUseCase', () => {
  let useCase: ResetPasswordUseCase;
  let mockAuthRepo: jest.Mocked<Pick<IAuthRepository, 'updateUser'>>;
  let mockUsersService: jest.Mocked<Pick<LawyersService, 'hashPassword'>>;
  let mockEmailService: jest.Mocked<Pick<EmailService, 'sendResetPasswordConfirmation'>>;

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
    password: 'old-hashed-password',
    appointments: [],
  };

  beforeEach(async () => {
    mockAuthRepo = {
      updateUser: jest.fn().mockResolvedValue(undefined),
    };

    mockUsersService = {
      hashPassword: jest.fn().mockReturnValue('new-hashed-password'),
    };

    mockEmailService = {
      sendResetPasswordConfirmation: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ResetPasswordUseCase,
        { provide: 'IAuthRepository', useValue: mockAuthRepo },
        { provide: LawyersService, useValue: mockUsersService },
        { provide: EmailService, useValue: mockEmailService },
      ],
    }).compile();

    useCase = module.get(ResetPasswordUseCase);
  });

  it('should hash password, update user, and return SE0002', async () => {
    const result = await useCase.execute({
      resetPasswordDto: { newPassword: 'NewPass1234' },
      user: mockUser as any,
    });

    expect(result.ok).toBe(true);
    expect(result.msgCode).toBe('SE0002');
    expect(mockUsersService.hashPassword).toHaveBeenCalledWith('NewPass1234');
    expect(mockAuthRepo.updateUser).toHaveBeenCalledWith(mockUser.id, {
      password: 'new-hashed-password',
    });
  });

  it('should send reset password confirmation email', async () => {
    await useCase.execute({
      resetPasswordDto: { newPassword: 'NewPass1234' },
      user: mockUser as any,
    });

    expect(mockEmailService.sendResetPasswordConfirmation).toHaveBeenCalledWith(
      mockUser.email,
      mockUser.name,
    );
  });
});
