import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSupportRequestReadStatus1739091000000
  implements MigrationInterface
{
  name = 'AddSupportRequestReadStatus1739091000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "support_requests"
      ADD COLUMN IF NOT EXISTS "isRead" boolean NOT NULL DEFAULT false;
    `);
    await queryRunner.query(`
      ALTER TABLE "support_requests"
      ADD COLUMN IF NOT EXISTS "readAt" TIMESTAMPTZ;
    `);
    await queryRunner.query(`
      ALTER TABLE "support_requests"
      ADD COLUMN IF NOT EXISTS "readByAdminId" integer;
    `);
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "IDX_support_requests_readByAdminId" ON "support_requests" ("readByAdminId")',
    );
    await queryRunner.query(`
      ALTER TABLE "support_requests"
      ADD CONSTRAINT "FK_support_requests_readByAdminId"
      FOREIGN KEY ("readByAdminId") REFERENCES "users"("id")
      ON DELETE SET NULL ON UPDATE NO ACTION;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "support_requests" DROP CONSTRAINT IF EXISTS "FK_support_requests_readByAdminId";',
    );
    await queryRunner.query(
      'DROP INDEX IF EXISTS "IDX_support_requests_readByAdminId";',
    );
    await queryRunner.query(
      'ALTER TABLE "support_requests" DROP COLUMN IF EXISTS "readByAdminId";',
    );
    await queryRunner.query(
      'ALTER TABLE "support_requests" DROP COLUMN IF EXISTS "readAt";',
    );
    await queryRunner.query(
      'ALTER TABLE "support_requests" DROP COLUMN IF EXISTS "isRead";',
    );
  }
}

