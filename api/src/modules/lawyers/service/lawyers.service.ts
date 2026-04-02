import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { validate as isUUID } from 'uuid';
import { User, UserStatus } from '../entities/user.entity';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from 'src/modules/auth/dto/create-user.dto';
import { ForgotPasswordDto, LoginUserDto } from 'src/modules/auth/dto';
import { RedisService } from 'src/modules/redis/redis.service';
import { EmailVerificationService } from 'src/modules/email-verification/email-verification.service';
import { ChangeEmailRequestDto } from '../dto/change-email-request.dto';
import { GetLawyerProfileUseCase } from '../use-cases/get-lawyer-profile.use-case';
import { UpdateLawyerProfileUseCase } from '../use-cases/update-lawyer-profile.use-case';
import { GetAllLawyersUseCase } from '../use-cases/get-all-lawyers.use-case';
import { ToggleLawyerStatusUseCase } from '../use-cases/toggle-lawyer-status.use-case';
import { DeleteAccountUseCase } from '../use-cases/delete-account.use-case';
import { RequestChangeEmailUseCase } from '../use-cases/request-change-email.use-case';
import { UpdateLawyerDto } from '../dto/update-lawyer.dto';
import { Inject } from '@nestjs/common';
import { ILawyersRepository } from '../repositories/lawyers.repository.interface';

@Injectable()
export class LawyersService {
  private readonly logger = new Logger('LawyersService');

  constructor(
    @Inject('ILawyersRepository')
    private readonly lawyersRepository: ILawyersRepository,
    private readonly redisService: RedisService,
    private readonly emailVerificationService: EmailVerificationService,
    private readonly getLawyerProfileUseCase: GetLawyerProfileUseCase,
    private readonly updateLawyerProfileUseCase: UpdateLawyerProfileUseCase,
    private readonly getAllLawyersUseCase: GetAllLawyersUseCase,
    private readonly toggleLawyerStatusUseCase: ToggleLawyerStatusUseCase,
    private readonly deleteAccountUseCase: DeleteAccountUseCase,
    private readonly requestChangeEmailUseCase: RequestChangeEmailUseCase,
  ) {}

  async create(
    createUserDto: CreateUserDto,
    options?: { emailVerifiedAt?: Date | null },
  ) {
    const existingUser = await this.lawyersRepository.findByEmail(
      createUserDto.email,
    );

    if (existingUser) {
      this.logger.error(`Duplicate email: ${createUserDto.email} [SE0025]`);
      throw new BadRequestException({ ok: false, msgCode: 'SE0025' });
    }

    try {
      createUserDto.name = createUserDto.name.toLowerCase().trim();
      createUserDto.active = true;

      const { password } = createUserDto;

      const savedUser = await this.lawyersRepository.save({
        ...createUserDto,
        password: this.hashPassword(password),
        emailVerifiedAt: options?.emailVerifiedAt ?? null,
      });

      this.logger.log(`User created successfully [GEN0002]`);
      const userResponse = savedUser as User & { isNew?: boolean };
      userResponse.isNew = true;
      return userResponse;
    } catch (error) {
      this.handleExceptions(error);
    }
  }

  async login(loginUserDto: LoginUserDto): Promise<User> {
    try {
      const { password, email } = loginUserDto;

      const user = await this.lawyersRepository.findByEmailWithPassword(email);

      if (!user) {
        this.logger.error('Invalid email (does not exist) [SE0022]');
        throw new UnauthorizedException({ ok: false, msgCode: 'SE0022' });
      }

      this.checkActiveUser(user);
      this.checkSuspendedUser(user);
      this.checkEmailVerified(user);

      if (!bcrypt.compareSync(password, user.password)) {
        this.logger.error(`Incorrect password [SE0023]`);
        throw new UnauthorizedException({ ok: false, msgCode: 'SE0023' });
      }

      delete user.password;
      delete user.active;

      this.logger.log(`Login successful for: ${user.email}`);
      const responseUser = user as User & { isNew?: boolean };
      responseUser.isNew = false;
      return responseUser;
    } catch (error) {
      this.handleExceptions(error);
    }
  }

  async findOne(term: string | ForgotPasswordDto) {
    let user: User | null = null;
    const isString = typeof term === 'string';
    const isEmail = isString && term.includes('@');

    if (isString && isUUID(term)) {
      user = await this.lawyersRepository.findById(term);
    } else if (isEmail) {
      user = await this.lawyersRepository.findByEmail(term as string);
    }

    if (!user) {
      this.logger.error(`User not found [SE0006]`);
      throw new NotFoundException({ ok: false, msgCode: 'SE0006' });
    }

    this.checkActiveUser(user);

    this.logger.log(`User found: ${user.email}`);
    return user;
  }

  async getMyProfile(user: User) {
    return this.getLawyerProfileUseCase.execute({
      userId: user.id,
      userEmail: user.email,
    });
  }

  async update(user: User, dto: UpdateLawyerDto) {
    return this.updateLawyerProfileUseCase.execute({ userId: user.id, dto });
  }

  async findAllLawyers(pagination?: { limit?: number; page?: number }) {
    return this.getAllLawyersUseCase.execute(pagination ?? {});
  }

  async toggleStatus(targetUserId: string, adminId: string) {
    return this.toggleLawyerStatusUseCase.execute({ targetUserId, adminId });
  }

  async requestChangeEmail(user: User, dto: ChangeEmailRequestDto) {
    return this.requestChangeEmailUseCase.execute({
      userId: user.id,
      newEmail: dto.newEmail,
    });
  }

  async remove(user: User, userId: string) {
    return this.deleteAccountUseCase.execute({ userId });
  }

  checkActiveUser(user: User) {
    if (!user?.active) {
      this.logger.error(`Inactive user: ${user.email} [ST0002]`);
      throw new BadRequestException({ ok: false, msgCode: 'ST0002' });
    }
  }

  checkSuspendedUser(user: Pick<User, 'email' | 'status'>) {
    if (user?.status === UserStatus.SUSPENDED) {
      this.logger.error(`Suspended user: ${user.email} [ST0004]`);
      throw new UnauthorizedException({ ok: false, msgCode: 'ST0004' });
    }
  }

  private checkEmailVerified(user: User) {
    if (!user.emailVerifiedAt) {
      this.logger.error(`User with unverified email: ${user.email} [SE0044]`);
      throw new UnauthorizedException({ ok: false, msgCode: 'SE0044' });
    }
  }

  hashPassword(password: string) {
    return bcrypt.hashSync(password, 10);
  }

  private handleExceptions(error: any) {
    if (error.code === '23505') {
      this.logger.error(`Duplicate email [SE0025]`);
      throw new BadRequestException({ ok: false, msgCode: 'SE0025' });
    }

    if (
      error instanceof UnauthorizedException ||
      error instanceof BadRequestException ||
      error instanceof NotFoundException
    ) {
      throw error;
    }

    this.logger.error(error);
    throw new InternalServerErrorException({ ok: false, msgCode: 'GEN0001' });
  }
}
