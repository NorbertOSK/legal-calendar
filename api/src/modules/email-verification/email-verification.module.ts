import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmailVerificationService } from './email-verification.service';
import { EmailVerification } from './entities/email-verification.entity';
import { User } from 'src/modules/lawyers/entities/user.entity';
import { RedisModule } from 'src/modules/redis/redis.module';

@Module({
  imports: [
    ConfigModule,
    RedisModule,
    TypeOrmModule.forFeature([EmailVerification, User]),
  ],
  providers: [
    EmailVerificationService,
  ],
  exports: [EmailVerificationService],
})
export class EmailVerificationModule {}
