import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSaleSellerAndWorkerSalesStats1739303000000
  implements MigrationInterface
{
  name = 'AddSaleSellerAndWorkerSalesStats1739303000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "workers"
      ADD COLUMN IF NOT EXISTS "soldPhonesCount" integer NOT NULL DEFAULT 0;
    `);
    await queryRunner.query(`
      ALTER TABLE "workers"
      ADD COLUMN IF NOT EXISTS "totalSoldAmount" numeric(14,2) NOT NULL DEFAULT 0;
    `);
    await queryRunner.query(`
      ALTER TABLE "workers"
      ADD COLUMN IF NOT EXISTS "percentSalaryAccrued" numeric(14,2) NOT NULL DEFAULT 0;
    `);

    await queryRunner.query(`
      ALTER TABLE "sales"
      ADD COLUMN IF NOT EXISTS "sellerWorkerId" integer;
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_sales_sellerWorkerId"
      ON "sales" ("sellerWorkerId");
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'FK_sales_sellerWorkerId'
        ) THEN
          ALTER TABLE "sales"
          ADD CONSTRAINT "FK_sales_sellerWorkerId"
          FOREIGN KEY ("sellerWorkerId") REFERENCES "workers"("id")
          ON DELETE SET NULL ON UPDATE NO ACTION;
        END IF;
      END
      $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "sales" DROP CONSTRAINT IF EXISTS "FK_sales_sellerWorkerId";
    `);
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_sales_sellerWorkerId";
    `);
    await queryRunner.query(`
      ALTER TABLE "sales" DROP COLUMN IF EXISTS "sellerWorkerId";
    `);
    await queryRunner.query(`
      ALTER TABLE "workers" DROP COLUMN IF EXISTS "percentSalaryAccrued";
    `);
    await queryRunner.query(`
      ALTER TABLE "workers" DROP COLUMN IF EXISTS "totalSoldAmount";
    `);
    await queryRunner.query(`
      ALTER TABLE "workers" DROP COLUMN IF EXISTS "soldPhonesCount";
    `);
  }
}

