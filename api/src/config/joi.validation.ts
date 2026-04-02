import * as Joi from 'joi';

export const JoiValidationSchema = Joi.object({
  CORS_WHITE_LIST: Joi.required(),
  DASHBOARD_DOMAIN: Joi.string().required(),
  JWT_EXPIRE_IN: Joi.string().required(),
  JWT_FORGET_PASSWORD_EXPIRE_IN: Joi.string().required(),
  JWT_SECRET: Joi.string().required(),
  JWT_SECRET_FORGET_PASSWORD: Joi.string().required(),
  DATABASE_URL: Joi.string().required(),
  PORT: Joi.number().default(3000),
  REDIS_URL: Joi.string().required(),
  SMTP_HOST: Joi.string().required(),
  SMTP_PORT: Joi.number().default(587),
  SMTP_USER: Joi.string().required(),
  SMTP_PASS: Joi.string().required(),
  SMTP_FROM: Joi.string().default('"Legal Calendar" <noreply@legalcalendar.app>'),
  JWT_REFRESH_EXPIRE_IN: Joi.string().optional().default('7d'),
}).unknown(true);
