import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddInventoryExpectedSalePrice1739082000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "inventory_items" ADD COLUMN IF NOT EXISTS "expectedSalePrice" numeric(12,2)',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "inventory_items" DROP COLUMN IF EXISTS "expectedSalePrice"',
    );
  }
}
