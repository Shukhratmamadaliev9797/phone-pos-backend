import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropUsersPasswordColumn1739059200000
  implements MigrationInterface
{
  name = 'DropUsersPasswordColumn1739059200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "users_role_enum" AS ENUM ('OWNER_ADMIN', 'MANAGER', 'CASHIER', 'TECHNICIAN');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "users" (
        "id" SERIAL PRIMARY KEY,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "deletedAt" TIMESTAMPTZ,
        "isActive" boolean NOT NULL DEFAULT true,
        "email" character varying(120),
        "username" character varying(80) NOT NULL,
        "fullName" character varying(120) NOT NULL,
        "passwordHash" character varying NOT NULL,
        "phoneNumber" character varying(30),
        "address" character varying(255),
        "lastLoginAt" TIMESTAMPTZ,
        "role" "users_role_enum" NOT NULL DEFAULT 'CASHIER',
        "refreshTokenVersion" integer NOT NULL DEFAULT 0
      );
    `);

    await queryRunner.query(
      'CREATE UNIQUE INDEX IF NOT EXISTS "IDX_users_email" ON "users" ("email")',
    );
    await queryRunner.query(
      'CREATE UNIQUE INDEX IF NOT EXISTS "IDX_users_username" ON "users" ("username")',
    );

    await queryRunner.query(
      'ALTER TABLE "users" DROP COLUMN IF EXISTS "password"',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "users" ADD COLUMN "password" character varying',
    );
  }
}
