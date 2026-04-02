import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { EmailService } from 'src/modules/email/email.service';
import { RedisService } from 'src/modules/redis/redis.service';
import { User } from 'src/modules/lawyers/entities/user.entity';
import { EmailVerification } from './entities/email-verification.entity';
import { EmailVerificationPurpose } from './enums/email-verification-purpose.enum';
import { EmailVerificationService } from './email-verification.service';

describe('EmailVerificationService', () => {
  let service: EmailVerificationService;
  let emailVerificationRepository: Partial<Repository<EmailVerification>>;
  let userRepository: Partial<Repository<User>>;
  let redisService: { deleteUserProfileCache: jest.Mock };

  beforeEach(() => {
    emailVerificationRepository = {
      findOne: jest.fn(),
      update: jest.fn().mockResolvedValue(undefined),
    };

    userRepository = {
      findOne: jest.fn(),
      update: jest.fn().mockResolvedValue(undefined),
    };

    redisService = {
      deleteUserProfileCache: jest.fn().mockResolvedValue(undefined),
    };

    service = new EmailVerificationService(
      emailVerificationRepository as Repository<EmailVerification>,
      userRepository as Repository<User>,
      {
        get: jest.fn().mockReturnValue('https://app.legalcalendar.test'),
      } as unknown as ConfigService,
      {
        sendEmailVerification: jest.fn(),
      } as unknown as EmailService,
      redisService as unknown as RedisService,
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('invalidates the cached user profile after confirming an email change', async () => {
    const verification = {
      id: 'verification-id',
      userId: 'user-id',
      purpose: EmailVerificationPurpose.CHANGE_EMAIL,
      verificationToken: 'token',
      targetEmail: 'new@example.com',
      codeHash: 'expected-hash',
      expiresAt: new Date(Date.now() + 60_000),
      attempts: 0,
      consumedAt: null,
    } as EmailVerification;

    jest
      .spyOn<any, any>(service, 'hashSecurityCode')
      .mockReturnValue('expected-hash');

    (emailVerificationRepository.findOne as jest.Mock).mockResolvedValue(
      verification,
    );
    (userRepository.findOne as jest.Mock)
      .mockResolvedValueOnce({
        id: 'user-id',
        email: 'old@example.com',
      })
      .mockResolvedValueOnce(null);

    const result = await service.verifyCode(
      EmailVerificationPurpose.CHANGE_EMAIL,
      'token',
      '123456',
      'user-id',
    );

    expect(userRepository.update).toHaveBeenCalledWith('user-id', {
      email: 'new@example.com',
    });
    expect(redisService.deleteUserProfileCache).toHaveBeenCalledWith('user-id');
    expect(emailVerificationRepository.update).toHaveBeenCalledWith(
      'verification-id',
      expect.objectContaining({
        consumedAt: expect.any(Date),
      }),
    );
    expect(result).toEqual(
      expect.objectContaining({
        ok: true,
        purpose: EmailVerificationPurpose.CHANGE_EMAIL,
        targetEmail: 'new@example.com',
      }),
    );
  });

  it('does not invalidate cache when the new email is already taken', async () => {
    const verification = {
      id: 'verification-id',
      userId: 'user-id',
      purpose: EmailVerificationPurpose.CHANGE_EMAIL,
      verificationToken: 'token',
      targetEmail: 'new@example.com',
      codeHash: 'expected-hash',
      expiresAt: new Date(Date.now() + 60_000),
      attempts: 0,
      consumedAt: null,
    } as EmailVerification;

    jest
      .spyOn<any, any>(service, 'hashSecurityCode')
      .mockReturnValue('expected-hash');

    (emailVerificationRepository.findOne as jest.Mock).mockResolvedValue(
      verification,
    );
    (userRepository.findOne as jest.Mock)
      .mockResolvedValueOnce({
        id: 'user-id',
        email: 'old@example.com',
      })
      .mockResolvedValueOnce({
        id: 'another-user-id',
      });

    await expect(
      service.verifyCode(
        EmailVerificationPurpose.CHANGE_EMAIL,
        'token',
        '123456',
        'user-id',
      ),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(userRepository.update).not.toHaveBeenCalled();
    expect(redisService.deleteUserProfileCache).not.toHaveBeenCalled();
  });
});
