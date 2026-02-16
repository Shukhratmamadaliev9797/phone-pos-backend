import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateDashboardMetrics1739600000000 implements MigrationInterface {
  name = 'CreateDashboardMetrics1739600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_type WHERE typname = 'dashboard_metrics_type_enum'
        ) THEN
          CREATE TYPE "dashboard_metrics_type_enum" AS ENUM (
            'PROFIT',
            'PURCHASE_PRICE',
            'SALE_PRICE',
            'REPAIR_PRICE',
            'SALARY_PAYMENT'
          );
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "dashboard_metrics" (
        "id" SERIAL NOT NULL,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "deletedAt" TIMESTAMPTZ,
        "isActive" boolean NOT NULL DEFAULT true,
        "type" "dashboard_metrics_type_enum" NOT NULL,
        "amount" numeric(14,2) NOT NULL,
        "happenedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "notes" text,
        CONSTRAINT "PK_dashboard_metrics_id" PRIMARY KEY ("id")
      );
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_dashboard_metrics_type"
      ON "dashboard_metrics" ("type");
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_dashboard_metrics_happenedAt"
      ON "dashboard_metrics" ("happenedAt");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_dashboard_metrics_happenedAt";
    `);
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_dashboard_metrics_type";
    `);
    await queryRunner.query(`
      DROP TABLE IF EXISTS "dashboard_metrics";
    `);
    await queryRunner.query(`
      DROP TYPE IF EXISTS "dashboard_metrics_type_enum";
    `);
  }
}

