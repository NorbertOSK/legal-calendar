import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';

import { User } from 'src/modules/lawyers/entities/user.entity';
import { LawyersModule } from 'src/modules/lawyers/lawyers.module';
import { EmailVerificationModule } from 'src/modules/email-verification/email-verification.module';
import { RefreshToken } from './entities/refresh-token.entity';

import { ForgotPasswordJwtStrategy, JwtStrategy } from './strategies';

import { AuthController } from './controller/auth.controller';
import { AuthService } from './service/auth.service';

import { AuthRepository } from './repositories/auth.repository';

import { LoginUseCase } from './use-cases/login.use-case';
import { RegisterUseCase } from './use-cases/register.use-case';
import { VerifyOtpUseCase } from './use-cases/verify-otp.use-case';
import { RecoverPasswordUseCase } from './use-cases/recover-password.use-case';
import { ResetPasswordUseCase } from './use-cases/reset-password.use-case';
import { RefreshTokenUseCase } from './use-cases/refresh-token.use-case';

@Module({
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    ForgotPasswordJwtStrategy,
    {
      provide: 'IAuthRepository',
      useClass: AuthRepository,
    },
    {
      provide: 'LoginUseCase',
      useClass: LoginUseCase,
    },
    {
      provide: 'RegisterUseCase',
      useClass: RegisterUseCase,
    },
    {
      provide: 'VerifyOtpUseCase',
      useClass: VerifyOtpUseCase,
    },
    {
      provide: 'RecoverPasswordUseCase',
      useClass: RecoverPasswordUseCase,
    },
    {
      provide: 'ResetPasswordUseCase',
      useClass: ResetPasswordUseCase,
    },
    {
      provide: 'RefreshTokenUseCase',
      useClass: RefreshTokenUseCase,
    },
  ],
  imports: [
    ConfigModule,
    forwardRef(() => LawyersModule),
    EmailVerificationModule,
    TypeOrmModule.forFeature([User, RefreshToken]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('jwtSecret'),
        signOptions: {
          expiresIn: configService.get('jwtExpireIn'),
        },
      }),
    }),
  ],
  exports: [JwtStrategy, PassportModule, JwtModule, AuthService],
})
export class AuthModule {}
