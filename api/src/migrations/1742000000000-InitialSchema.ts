import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1742000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "valid_roles_enum" AS ENUM ('lawyer', 'admin');
      EXCEPTION WHEN duplicate_object THEN null; END $$
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "user_status_enum" AS ENUM ('active', 'suspended');
      EXCEPTION WHEN duplicate_object THEN null; END $$
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "appointment_type_enum" AS ENUM ('IN_PERSON', 'VIDEO_CALL', 'PHONE');
      EXCEPTION WHEN duplicate_object THEN null; END $$
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "appointment_status_enum" AS ENUM ('SCHEDULED', 'COMPLETED', 'CANCELLED');
      EXCEPTION WHEN duplicate_object THEN null; END $$
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "email_verification_purpose_enum" AS ENUM ('signup', 'change_email');
      EXCEPTION WHEN duplicate_object THEN null; END $$
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "users" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" text NOT NULL,
        "email" text NOT NULL,
        "country" varchar(100),
        "timezone" varchar(100) NOT NULL DEFAULT 'America/Argentina/Buenos_Aires',
        "password" text NOT NULL,
        "active" boolean NOT NULL DEFAULT true,
        "role" "valid_roles_enum" NOT NULL DEFAULT 'lawyer',
        "status" "user_status_enum" NOT NULL DEFAULT 'active',
        "emailVerifiedAt" timestamp,
        "createdAt" timestamp NOT NULL DEFAULT now(),
        "updatedAt" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "PK_users_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_users_email" UNIQUE ("email")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "appointments" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "lawyerId" uuid NOT NULL,
        "clientName" varchar(255) NOT NULL,
        "clientEmail" varchar(255) NOT NULL,
        "clientPhone" varchar(50),
        "clientTimezone" varchar(100),
        "type" "appointment_type_enum" NOT NULL,
        "title" varchar(255) NOT NULL,
        "description" text,
        "startsAt" timestamptz NOT NULL,
        "endsAt" timestamptz NOT NULL,
        "status" "appointment_status_enum" NOT NULL DEFAULT 'SCHEDULED',
        "location" varchar(500),
        "meetingLink" varchar(500),
        "createdAt" timestamp NOT NULL DEFAULT now(),
        "updatedAt" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "PK_appointments_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_appointments_lawyerId" FOREIGN KEY ("lawyerId") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "refresh_tokens" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "userId" uuid NOT NULL,
        "tokenHash" text NOT NULL,
        "expiresAt" timestamp NOT NULL,
        "revokedAt" timestamp,
        "createdAt" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "PK_refresh_tokens_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_refresh_tokens_userId" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "admin_invitations" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "email" text NOT NULL,
        "invitedById" uuid NOT NULL,
        "token" text NOT NULL,
        "expiresAt" timestamp NOT NULL,
        "acceptedAt" timestamp,
        "createdAt" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "PK_admin_invitations_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_admin_invitations_token" UNIQUE ("token"),
        CONSTRAINT "FK_admin_invitations_invitedById" FOREIGN KEY ("invitedById") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "email_verifications" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "userId" uuid NOT NULL,
        "purpose" "email_verification_purpose_enum" NOT NULL,
        "targetEmail" text NOT NULL,
        "codeHash" text NOT NULL,
        "verificationToken" text NOT NULL,
        "expiresAt" timestamp NOT NULL,
        "consumedAt" timestamp,
        "attempts" integer NOT NULL DEFAULT 0,
        "resendCount" integer NOT NULL DEFAULT 0,
        "createdAt" timestamp NOT NULL DEFAULT now(),
        "updatedAt" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "PK_email_verifications_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_email_verifications_verificationToken" UNIQUE ("verificationToken"),
        CONSTRAINT "FK_email_verifications_userId" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_user_role" ON "users" ("role")`);

    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_appointment_lawyer" ON "appointments" ("lawyerId")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_appointment_lawyer_starts" ON "appointments" ("lawyerId", "startsAt")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_appointment_lawyer_status" ON "appointments" ("lawyerId", "status")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_appointment_overlap" ON "appointments" ("lawyerId", "startsAt", "endsAt")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_appointment_client_email" ON "appointments" ("clientEmail")`);

    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_refresh_token_hash" ON "refresh_tokens" ("tokenHash")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_refresh_token_user" ON "refresh_tokens" ("userId")`);

    await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS "idx_invitation_token" ON "admin_invitations" ("token")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_invitation_email" ON "admin_invitations" ("email")`);

    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_email_verification_user_purpose" ON "email_verifications" ("userId", "purpose")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_email_verification_target_email" ON "email_verifications" ("targetEmail")`);
    await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS "idx_email_verification_verification_token" ON "email_verifications" ("verificationToken")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "email_verifications" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "admin_invitations" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "refresh_tokens" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "appointments" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users" CASCADE`);

    await queryRunner.query(`DROP TYPE IF EXISTS "email_verification_purpose_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "appointment_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "appointment_type_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "user_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "valid_roles_enum"`);
  }
}
