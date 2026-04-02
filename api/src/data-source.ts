import 'reflect-metadata';
import { config } from 'dotenv';
import { DataSource } from 'typeorm';
import { join } from 'path';

import { User } from './modules/lawyers/entities/user.entity';
import { EmailVerification } from './modules/email-verification/entities/email-verification.entity';
import { RefreshToken } from './modules/auth/entities/refresh-token.entity';
import { AdminInvitation } from './modules/invitations/entities/admin-invitation.entity';
import { Appointment } from './modules/appointments/entities/appointment.entity';

config();

const isProd = __dirname.includes('dist');
const migrationsExt = isProd ? 'js' : 'ts';
const migrationsDir = join(__dirname, 'migrations');

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  synchronize: false,
  logging: false,
  entities: [
    User,
    EmailVerification,
    RefreshToken,
    AdminInvitation,
    Appointment,
  ],
  migrations: [join(migrationsDir, `*.${migrationsExt}`)],
  extra: {
    max: 50,
    min: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  },
});
