import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSaleInstallmentFields1739300000000
  implements MigrationInterface
{
  name = 'AddSaleInstallmentFields1739300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "sales"
      ADD COLUMN IF NOT EXISTS "installmentMonths" integer
    `);
    await queryRunner.query(`
      ALTER TABLE "sales"
      ADD COLUMN IF NOT EXISTS "firstPaymentNow" boolean
    `);
    await queryRunner.query(`
      ALTER TABLE "sales"
      ADD COLUMN IF NOT EXISTS "monthlyInstallmentAmount" numeric(12,2)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "sales"
      DROP COLUMN IF EXISTS "monthlyInstallmentAmount"
    `);
    await queryRunner.query(`
      ALTER TABLE "sales"
      DROP COLUMN IF EXISTS "firstPaymentNow"
    `);
    await queryRunner.query(`
      ALTER TABLE "sales"
      DROP COLUMN IF EXISTS "installmentMonths"
    `);
  }
}

