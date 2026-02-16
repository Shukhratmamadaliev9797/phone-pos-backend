import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddWorkerSalaryType1739302000000 implements MigrationInterface {
  name = 'AddWorkerSalaryType1739302000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_type WHERE typname = 'workers_salarytype_enum'
        ) THEN
          CREATE TYPE "workers_salarytype_enum" AS ENUM ('MONTHLY', 'PERCENT');
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      ALTER TABLE "workers"
      ADD COLUMN IF NOT EXISTS "salaryType" "workers_salarytype_enum" NOT NULL DEFAULT 'MONTHLY';
    `);

    await queryRunner.query(`
      ALTER TABLE "workers"
      ADD COLUMN IF NOT EXISTS "salaryPercent" numeric(5,2);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "workers" DROP COLUMN IF EXISTS "salaryPercent";
    `);

    await queryRunner.query(`
      ALTER TABLE "workers" DROP COLUMN IF EXISTS "salaryType";
    `);

    await queryRunner.query(`
      DROP TYPE IF EXISTS "workers_salarytype_enum";
    `);
  }
}

