import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddWorkerTotalProfitAmount1739530000000
  implements MigrationInterface
{
  name = 'AddWorkerTotalProfitAmount1739530000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "workers"
      ADD COLUMN IF NOT EXISTS "totalProfitAmount" numeric(14,2) NOT NULL DEFAULT 0;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "workers" DROP COLUMN IF EXISTS "totalProfitAmount";
    `);
  }
}
