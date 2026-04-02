import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { User } from './entities/user.entity';
import { RedisModule } from 'src/modules/redis/redis.module';
import { EmailVerificationModule } from 'src/modules/email-verification/email-verification.module';

import { LawyersController } from './controller/lawyers.controller';
import { LawyersService } from './service/lawyers.service';

import { LawyersRepository } from './repositories/lawyers.repository';

import { GetLawyerProfileUseCase } from './use-cases/get-lawyer-profile.use-case';
import { UpdateLawyerProfileUseCase } from './use-cases/update-lawyer-profile.use-case';
import { GetAllLawyersUseCase } from './use-cases/get-all-lawyers.use-case';
import { ToggleLawyerStatusUseCase } from './use-cases/toggle-lawyer-status.use-case';
import { DeleteAccountUseCase } from './use-cases/delete-account.use-case';
import { RequestChangeEmailUseCase } from './use-cases/request-change-email.use-case';

@Module({
  controllers: [LawyersController],
  providers: [
    LawyersService,
    {
      provide: 'ILawyersRepository',
      useClass: LawyersRepository,
    },
    GetLawyerProfileUseCase,
    UpdateLawyerProfileUseCase,
    GetAllLawyersUseCase,
    ToggleLawyerStatusUseCase,
    DeleteAccountUseCase,
    RequestChangeEmailUseCase,
  ],
  imports: [
    ConfigModule,
    RedisModule,
    EmailVerificationModule,
    TypeOrmModule.forFeature([User]),
  ],
  exports: [LawyersService],
})
export class LawyersModule {}
