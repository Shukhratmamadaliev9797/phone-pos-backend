import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddInventoryMetricTypes1739603000000 implements MigrationInterface {
  name = 'AddInventoryMetricTypes1739603000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_enum e
          JOIN pg_type t ON t.oid = e.enumtypid
          WHERE t.typname = 'dashboard_metrics_type_enum'
            AND e.enumlabel = 'INVENTORY_PHONES'
        ) THEN
          ALTER TYPE "dashboard_metrics_type_enum" ADD VALUE 'INVENTORY_PHONES';
        END IF;

        IF NOT EXISTS (
          SELECT 1
          FROM pg_enum e
          JOIN pg_type t ON t.oid = e.enumtypid
          WHERE t.typname = 'dashboard_metrics_type_enum'
            AND e.enumlabel = 'INVENTORY_TOTAL_PRICE'
        ) THEN
          ALTER TYPE "dashboard_metrics_type_enum" ADD VALUE 'INVENTORY_TOTAL_PRICE';
        END IF;
      END
      $$;
    `);
  }

  public async down(): Promise<void> {
    // Postgres enum value removal is not safe in-place.
  }
}
