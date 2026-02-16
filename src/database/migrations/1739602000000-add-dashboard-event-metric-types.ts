import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDashboardEventMetricTypes1739602000000
  implements MigrationInterface
{
  name = 'AddDashboardEventMetricTypes1739602000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_enum e
          JOIN pg_type t ON t.oid = e.enumtypid
          WHERE t.typname = 'dashboard_metrics_type_enum'
            AND e.enumlabel = 'WORKERS'
        ) THEN
          ALTER TYPE "dashboard_metrics_type_enum" ADD VALUE 'WORKERS';
        END IF;

        IF NOT EXISTS (
          SELECT 1
          FROM pg_enum e
          JOIN pg_type t ON t.oid = e.enumtypid
          WHERE t.typname = 'dashboard_metrics_type_enum'
            AND e.enumlabel = 'SOLD_PHONES'
        ) THEN
          ALTER TYPE "dashboard_metrics_type_enum" ADD VALUE 'SOLD_PHONES';
        END IF;

        IF NOT EXISTS (
          SELECT 1
          FROM pg_enum e
          JOIN pg_type t ON t.oid = e.enumtypid
          WHERE t.typname = 'dashboard_metrics_type_enum'
            AND e.enumlabel = 'PURCHASED_PHONES'
        ) THEN
          ALTER TYPE "dashboard_metrics_type_enum" ADD VALUE 'PURCHASED_PHONES';
        END IF;

        IF NOT EXISTS (
          SELECT 1
          FROM pg_enum e
          JOIN pg_type t ON t.oid = e.enumtypid
          WHERE t.typname = 'dashboard_metrics_type_enum'
            AND e.enumlabel = 'CUSTOMER_DEBTS'
        ) THEN
          ALTER TYPE "dashboard_metrics_type_enum" ADD VALUE 'CUSTOMER_DEBTS';
        END IF;

        IF NOT EXISTS (
          SELECT 1
          FROM pg_enum e
          JOIN pg_type t ON t.oid = e.enumtypid
          WHERE t.typname = 'dashboard_metrics_type_enum'
            AND e.enumlabel = 'SHOP_DEBTS'
        ) THEN
          ALTER TYPE "dashboard_metrics_type_enum" ADD VALUE 'SHOP_DEBTS';
        END IF;
      END
      $$;
    `);
  }

  public async down(): Promise<void> {
    // Postgres enum value removal is not safe in-place.
  }
}
