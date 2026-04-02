import { EnvConfiguration } from './env.config';
import { JoiValidationSchema } from './joi.validation';

describe('env.config', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      CORS_WHITE_LIST: 'http://localhost:3000',
      DASHBOARD_DOMAIN: 'http://localhost:5172',
      JWT_EXPIRE_IN: '24h',
      JWT_FORGET_PASSWORD_EXPIRE_IN: '10m',
      JWT_SECRET: 'secret',
      JWT_SECRET_FORGET_PASSWORD: 'forgot-secret',
      DATABASE_URL: 'postgres://user:pass@localhost:5432/db',
      PORT: '3000',
      REDIS_URL: 'redis://localhost:6379',
      SMTP_HOST: 'smtp.example.com',
      SMTP_PORT: '587',
      SMTP_USER: 'user',
      SMTP_PASS: 'pass',
    };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('exposes databaseUrl from environment configuration', () => {
    expect(EnvConfiguration().databaseUrl).toBe(
      'postgres://user:pass@localhost:5432/db',
    );
  });

  it('defaults dashboardDomain to legalcalendar.app', () => {
    delete process.env.DASHBOARD_DOMAIN;
    expect(EnvConfiguration().dashboardDomain).toBe(
      'https://app.legalcalendar.app',
    );
  });

  it('requires DATABASE_URL in Joi validation', () => {
    delete process.env.DATABASE_URL;
    const { error } = JoiValidationSchema.validate(process.env);
    expect(error?.details.some((d) => d.path[0] === 'DATABASE_URL')).toBe(true);
  });

  it('validates successfully with all required variables', () => {
    const { error } = JoiValidationSchema.validate(process.env);
    expect(error).toBeUndefined();
  });
});
