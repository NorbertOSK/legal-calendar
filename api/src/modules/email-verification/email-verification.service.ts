import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createHash, randomBytes, randomUUID } from 'crypto';
import { ConfigService } from '@nestjs/config';
import { EmailService } from 'src/modules/email/email.service';
import { RedisService } from 'src/modules/redis/redis.service';
import { User } from 'src/modules/lawyers/entities/user.entity';
import { EmailVerification } from './entities/email-verification.entity';
import { EmailVerificationPurpose } from './enums/email-verification-purpose.enum';

const OTP_TTL_MINUTES = 10;
const OTP_MAX_ATTEMPTS = 5;
const OTP_MAX_RESENDS_PER_HOUR = 3;
const OTP_MAX_ISSUES_PER_HOUR = OTP_MAX_RESENDS_PER_HOUR + 1;

@Injectable()
export class EmailVerificationService {
  private readonly logger = new Logger(EmailVerificationService.name);
  private readonly dashboardDomain: string;

  constructor(
    @InjectRepository(EmailVerification)
    private readonly emailVerificationRepository: Repository<EmailVerification>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
    private readonly redisService: RedisService,
  ) {
    this.dashboardDomain = this.configService.get<string>('dashboardDomain');
  }

  async createSignupVerification(user: User) {
    return this.createVerification({
      user,
      purpose: EmailVerificationPurpose.SIGNUP,
      targetEmail: user.email,
      linkPath: '/auth/verify-email',
    });
  }

  async createChangeEmailVerification(
    user: User,
    targetEmail: string,
  ) {
    return this.createVerification({
      user,
      purpose: EmailVerificationPurpose.CHANGE_EMAIL,
      targetEmail,
      linkPath: '/dashboard/settings',
    });
  }

  async resendVerification(
    purpose: EmailVerificationPurpose,
    verificationToken: string,
    requesterUserId?: string,
  ) {
    const current = await this.getActiveVerificationByToken(purpose, verificationToken);

    if (requesterUserId && current.userId !== requesterUserId) {
      this.logger.error(
        `Intento de reenvío sin permiso para verificación ${current.id} [SE0041]`,
      );
      throw new UnauthorizedException({ ok: false, msgCode: 'SE0041' });
    }

    await this.emailVerificationRepository.update(current.id, {
      consumedAt: new Date(),
    });

    const user = await this.userRepository.findOne({
      where: { id: current.userId },
      select: {
        id: true,
        email: true,
        name: true,
        active: true,
        emailVerifiedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException({ ok: false, msgCode: 'SE0006' });
    }

    const linkPath =
      current.purpose === EmailVerificationPurpose.SIGNUP
        ? '/auth/verify-email'
        : '/dashboard/settings';

    const next = await this.createVerification({
      user,
      purpose: current.purpose,
      targetEmail: current.targetEmail,
      linkPath,
      resendCount: current.resendCount + 1,
    });

    return {
      ok: true,
      msgCode: 'SE0042',
      verificationToken: next.verificationToken,
      expiresAt: next.expiresAt,
    };
  }

  async verifyCode(
    purpose: EmailVerificationPurpose,
    verificationToken: string,
    securityCode: string,
    requesterUserId?: string,
  ) {
    const verification = await this.getActiveVerificationByToken(
      purpose,
      verificationToken,
    );

    if (requesterUserId && verification.userId !== requesterUserId) {
      this.logger.error(
        `Intento de verificación sin permiso para verificación ${verification.id} [SE0041]`,
      );
      throw new UnauthorizedException({ ok: false, msgCode: 'SE0041' });
    }

    if (verification.expiresAt.getTime() < Date.now()) {
      await this.emailVerificationRepository.update(verification.id, {
        consumedAt: new Date(),
      });
      throw new BadRequestException({ ok: false, msgCode: 'SE0036' });
    }

    if (verification.attempts >= OTP_MAX_ATTEMPTS) {
      throw new BadRequestException({ ok: false, msgCode: 'SE0038' });
    }

    const isValid = this.hashSecurityCode(securityCode) === verification.codeHash;

    if (!isValid) {
      await this.emailVerificationRepository.update(verification.id, {
        attempts: verification.attempts + 1,
      });

      if (verification.attempts + 1 >= OTP_MAX_ATTEMPTS) {
        await this.emailVerificationRepository.update(verification.id, {
          consumedAt: new Date(),
        });
      }
      throw new BadRequestException({ ok: false, msgCode: 'SE0037' });
    }

    const now = new Date();

    if (purpose === EmailVerificationPurpose.SIGNUP) {
      await this.userRepository.update(verification.userId, {
        emailVerifiedAt: now,
      });
    }

    if (purpose === EmailVerificationPurpose.CHANGE_EMAIL) {
      const currentUser = await this.userRepository.findOne({
        where: { id: verification.userId },
        select: {
          id: true,
          email: true,
        },
      });

      if (!currentUser) {
        throw new NotFoundException({ ok: false, msgCode: 'SE0006' });
      }

      if (currentUser.email !== verification.targetEmail) {
        const existing = await this.userRepository.findOne({
          where: { email: verification.targetEmail },
          select: { id: true },
        });

        if (existing && existing.id !== verification.userId) {
          throw new BadRequestException({ ok: false, msgCode: 'SE0025' });
        }
      }

      await this.userRepository.update(verification.userId, {
        email: verification.targetEmail,
      });

      await this.redisService.deleteUserProfileCache(verification.userId);
    }

    await this.emailVerificationRepository.update(verification.id, {
      consumedAt: now,
    });

    return {
      ok: true,
      msgCode: 'SE0039',
      userId: verification.userId,
      purpose,
      targetEmail: verification.targetEmail,
    };
  }

  async cleanupOldVerifications() {
    const now = new Date();
    const consumedCutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const expiredCutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const deleteConsumedResult = await this.emailVerificationRepository
      .createQueryBuilder()
      .delete()
      .from(EmailVerification)
      .where('"consumedAt" IS NOT NULL')
      .andWhere('"consumedAt" < :consumedCutoff', { consumedCutoff })
      .execute();

    const deleteExpiredResult = await this.emailVerificationRepository
      .createQueryBuilder()
      .delete()
      .from(EmailVerification)
      .where('"consumedAt" IS NULL')
      .andWhere('"expiresAt" < :expiredCutoff', { expiredCutoff })
      .execute();

    this.logger.log(
      `Cleanup email verifications -> consumed:${deleteConsumedResult.affected || 0}, expired:${deleteExpiredResult.affected || 0}`,
    );
  }

  private async createVerification(params: {
    user: User;
    purpose: EmailVerificationPurpose;
    targetEmail: string;
    linkPath: string;
    resendCount?: number;
  }) {
    const { user, purpose, targetEmail, linkPath, resendCount = 0 } =
      params;

    await this.assertIssueRateLimit(user.id, purpose);

    await this.emailVerificationRepository
      .createQueryBuilder()
      .update(EmailVerification)
      .set({ consumedAt: new Date() })
      .where('"userId" = :userId', { userId: user.id })
      .andWhere('purpose = :purpose', { purpose })
      .andWhere('"consumedAt" IS NULL')
      .execute();

    const securityCode = this.generateSecurityCode();
    const verificationToken = randomUUID();
    const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);

    const verification = this.emailVerificationRepository.create({
      userId: user.id,
      purpose,
      targetEmail,
      codeHash: this.hashSecurityCode(securityCode),
      verificationToken,
      expiresAt,
      attempts: 0,
      resendCount,
    });

    const saved = await this.emailVerificationRepository.save(verification);

    const link = `${this.dashboardDomain}${linkPath}?token=${verificationToken}&purpose=${purpose}`;

    this.emailService.sendEmailVerification(
      targetEmail,
      user.name,
      securityCode,
      link,
      purpose,
    );

    return {
      verificationId: saved.id,
      verificationToken,
      expiresAt,
    };
  }

  private async getActiveVerificationByToken(
    purpose: EmailVerificationPurpose,
    verificationToken: string,
  ): Promise<EmailVerification> {
    const verification = await this.emailVerificationRepository.findOne({
      where: {
        purpose,
        verificationToken,
        consumedAt: null,
      },
    });

    if (!verification) {
      throw new NotFoundException({ ok: false, msgCode: 'SE0036' });
    }

    return verification;
  }

  private async assertIssueRateLimit(
    userId: string,
    purpose: EmailVerificationPurpose,
  ): Promise<void> {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    const count = await this.emailVerificationRepository
      .createQueryBuilder('verification')
      .where('verification.userId = :userId', { userId })
      .andWhere('verification.purpose = :purpose', { purpose })
      .andWhere('verification.createdAt >= :oneHourAgo', { oneHourAgo })
      .getCount();

    if (count >= OTP_MAX_ISSUES_PER_HOUR) {
      throw new BadRequestException({ ok: false, msgCode: 'SE0043' });
    }
  }

  private hashSecurityCode(code: string): string {
    const pepper = this.configService.get<string>('jwtSecret') || 'otp-pepper';
    return createHash('sha256').update(`${code}:${pepper}`).digest('hex');
  }

  private generateSecurityCode(): string {
    const code = randomBytes(4).readUInt32BE(0) % 1_000_000;
    return code.toString().padStart(6, '0');
  }
}
