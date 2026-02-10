import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSupportRequests1739090000000
  implements MigrationInterface
{
  name = 'CreateSupportRequests1739090000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "support_requests_senderrole_enum" AS ENUM ('OWNER_ADMIN', 'MANAGER', 'CASHIER', 'TECHNICIAN');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "support_requests" (
        "id" SERIAL PRIMARY KEY,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "deletedAt" TIMESTAMPTZ,
        "isActive" boolean NOT NULL DEFAULT true,
        "senderUserId" integer,
        "senderFullName" varchar(120) NOT NULL,
        "senderRole" "support_requests_senderrole_enum" NOT NULL,
        "message" text NOT NULL
      );
    `);

    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "IDX_support_requests_senderUserId" ON "support_requests" ("senderUserId")',
    );

    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'FK_support_requests_senderUserId'
        ) THEN
          ALTER TABLE "support_requests"
          ADD CONSTRAINT "FK_support_requests_senderUserId"
          FOREIGN KEY ("senderUserId") REFERENCES "users"("id")
          ON DELETE SET NULL ON UPDATE NO ACTION;
        END IF;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "support_requests" DROP CONSTRAINT IF EXISTS "FK_support_requests_senderUserId";',
    );
    await queryRunner.query(
      'DROP INDEX IF EXISTS "IDX_support_requests_senderUserId";',
    );
    await queryRunner.query('DROP TABLE IF EXISTS "support_requests";');
    await queryRunner.query('DROP TYPE IF EXISTS "support_requests_senderrole_enum";');
  }
}
