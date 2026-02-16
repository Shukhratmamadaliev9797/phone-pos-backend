import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSaleRevenueDashboardMetricType1739601000000
  implements MigrationInterface
{
  name = 'AddSaleRevenueDashboardMetricType1739601000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_enum e
          JOIN pg_type t ON t.oid = e.enumtypid
          WHERE t.typname = 'dashboard_metrics_type_enum'
            AND e.enumlabel = 'SALE_REVENUE'
        ) THEN
          ALTER TYPE "dashboard_metrics_type_enum" ADD VALUE 'SALE_REVENUE';
        END IF;
      END
      $$;
    `);
  }

  public async down(): Promise<void> {
    // Postgres enum value removal is not safe in-place.
  }
}
