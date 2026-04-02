import { Injectable, Inject, Logger } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService {
  private readonly logger = new Logger('RedisService');

  constructor(@Inject('REDIS') private readonly redisClient: Redis) {}

  async get<T>(key: string): Promise<T | null> {
    try {
      const data = await this.redisClient.get(key);
      if (data) {
        this.logger.debug(`Cache HIT - Key: ${key}`);
        return JSON.parse(data);
      }
      this.logger.debug(`Cache MISS - Key: ${key}`);
      return null;
    } catch (error) {
      this.logger.error('Error getting data from cache', error);
      return null;
    }
  }

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    try {
      const serializedValue = JSON.stringify(value);
      if (ttlSeconds) {
        await this.redisClient.setex(key, ttlSeconds, serializedValue);
        this.logger.debug(`Cache set with TTL ${ttlSeconds}s - Key: ${key}`);
      } else {
        await this.redisClient.set(key, serializedValue);
        this.logger.debug(`Cache set (no expiry) - Key: ${key}`);
      }
    } catch (error) {
      this.logger.error('Error setting data in cache', error);
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await this.redisClient.del(key);
      this.logger.debug(`Cache deleted - Key: ${key}`);
    } catch (error) {
      this.logger.error('Error deleting data from cache', error);
    }
  }

  async deleteByPattern(pattern: string): Promise<void> {
    try {
      let cursor = '0';
      do {
        const [nextCursor, keys] = await this.redisClient.scan(
          cursor,
          'MATCH',
          pattern,
          'COUNT',
          100,
        );
        cursor = nextCursor;
        if (keys.length > 0) {
          await this.redisClient.del(...keys);
        }
      } while (cursor !== '0');
      this.logger.debug(`Cache deleted by pattern - Pattern: ${pattern}`);
    } catch (error) {
      this.logger.error('Error deleting data by pattern from cache', error);
    }
  }

  async incrementCounterWithTtl(
    key: string,
    ttlSeconds: number,
  ): Promise<number> {
    try {
      const totalHits = await this.redisClient.incr(key);
      if (totalHits === 1) {
        await this.redisClient.expire(key, ttlSeconds);
      }
      return totalHits;
    } catch (error) {
      this.logger.error('Error incrementing counter with TTL', error);
      return 0;
    }
  }

  async getString(key: string): Promise<string | null> {
    try {
      const data = await this.redisClient.get(key);
      return data;
    } catch (error) {
      this.logger.error('Error getting string', error);
      return null;
    }
  }

  async setString(
    key: string,
    value: string,
    ttlSeconds?: number,
  ): Promise<void> {
    try {
      if (ttlSeconds) {
        await this.redisClient.setex(key, ttlSeconds, value);
      } else {
        await this.redisClient.set(key, value);
      }
    } catch (error) {
      this.logger.error('Error setting string', error);
    }
  }

  async decrement(key: string): Promise<number> {
    try {
      const current = await this.redisClient.get(key);
      if (!current) return 0;
      const newValue = Math.max(0, parseInt(current, 10) - 1);
      await this.redisClient.set(key, String(newValue));
      return newValue;
    } catch (error) {
      this.logger.error('Error decrementing', error);
      return 0;
    }
  }

  generateUserProfileKey(userId: string): string {
    return `user-profile:${userId}`;
  }

  async deleteUserProfileCache(userId: string): Promise<void> {
    try {
      const key = this.generateUserProfileKey(userId);
      await this.delete(key);
      this.logger.debug(`User profile cache deleted: ${userId}`);
    } catch (error) {
      this.logger.error('Error deleting user profile cache', error);
    }
  }
}
