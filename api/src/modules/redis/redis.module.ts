import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { RedisService } from './redis.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: 'REDIS',
      useFactory: (configService: ConfigService) => {
        const redisUrl = configService.get<string>('redisURL');

        if (!redisUrl) {
          throw new Error('REDIS_URL is required');
        }

        const redisUrlWithFamily = redisUrl + '?family=0';
        const redis = new Redis(redisUrlWithFamily);

        return redis;
      },
      inject: [ConfigService],
    },
    RedisService,
  ],
  exports: ['REDIS', RedisService],
})
export class RedisModule {}
