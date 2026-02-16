import { MigrationInterface, QueryRunner } from 'typeorm';

export class MakeWorkerPhoneOptional1739532000000
  implements MigrationInterface
{
  name = 'MakeWorkerPhoneOptional1739532000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      DECLARE idx record;
      BEGIN
        FOR idx IN
          SELECT indexname
          FROM pg_indexes
          WHERE schemaname = 'public'
            AND tablename = 'workers'
            AND indexdef ILIKE '%UNIQUE%'
            AND indexdef ILIKE '%("phoneNumber")%'
        LOOP
          EXECUTE format('DROP INDEX IF EXISTS %I', idx.indexname);
        END LOOP;
      END
      $$;
    `);

    await queryRunner.query(`
      ALTER TABLE "workers"
      ALTER COLUMN "phoneNumber" DROP NOT NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE "workers"
      SET "phoneNumber" = CONCAT('wrk_', id)
      WHERE "phoneNumber" IS NULL;
    `);

    await queryRunner.query(`
      ALTER TABLE "workers"
      ALTER COLUMN "phoneNumber" SET NOT NULL;
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_workers_phoneNumber_unique"
      ON "workers" ("phoneNumber");
    `);
  }
}
