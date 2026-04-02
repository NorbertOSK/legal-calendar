import 'reflect-metadata';
import { config } from 'dotenv';
import * as bcrypt from 'bcrypt';
import { AppDataSource } from '../../data-source';
import { User } from '../../modules/lawyers/entities/user.entity';

config();

const ADMIN_EMAIL = 'admin@legalcalendar.app';
const ADMIN_NAME = 'Admin';

const ADMIN_PASSWORD = process.env.ADMIN_SEED_PASSWORD;
if (!ADMIN_PASSWORD) {
  console.error(
    'ERROR: La variable de entorno ADMIN_SEED_PASSWORD es requerida.\n' +
    'Configúrala en tu archivo .env antes de ejecutar el seed.\n' +
    'Ejemplo: ADMIN_SEED_PASSWORD=MiPassword@Segura123',
  );
  process.exit(1);
}

async function seed() {
  await AppDataSource.initialize();

  const userRepo = AppDataSource.getRepository(User);

  const existing = await userRepo.findOne({ where: { email: ADMIN_EMAIL } });
  if (existing) {
    console.log(`Admin user already exists: ${ADMIN_EMAIL}`);
    await AppDataSource.destroy();
    return;
  }

  const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);

  const admin = userRepo.create({
    name: ADMIN_NAME,
    email: ADMIN_EMAIL,
    password: hashedPassword,
    role: 'admin' as any,
    active: true,
    emailVerifiedAt: new Date(),
  });

  await userRepo.save(admin);
  console.log(`Admin user created: ${ADMIN_EMAIL}`);

  await AppDataSource.destroy();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
