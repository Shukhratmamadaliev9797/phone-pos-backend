import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSaleProfit1739301000000 implements MigrationInterface {
  name = 'AddSaleProfit1739301000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "sales"
      ADD COLUMN IF NOT EXISTS "profit" numeric(12,2)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "sales"
      DROP COLUMN IF EXISTS "profit"
    `);
  }
}

