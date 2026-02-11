import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixSaleItemUniqueActiveIndex1739195000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "sale_items"
      DROP CONSTRAINT IF EXISTS "UQ_sale_items_itemId";
    `);

    await queryRunner.query(`
      DO $$
      DECLARE idx record;
      BEGIN
        FOR idx IN
          SELECT indexname
          FROM pg_indexes
          WHERE schemaname = 'public'
            AND tablename = 'sale_items'
            AND indexdef ILIKE 'CREATE UNIQUE INDEX%'
            AND indexdef ILIKE '%("itemId")%'
        LOOP
          EXECUTE format('DROP INDEX IF EXISTS %I', idx.indexname);
        END LOOP;
      END
      $$;
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "UQ_sale_items_itemId_active"
      ON "sale_items" ("itemId")
      WHERE "isActive" = true;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS "UQ_sale_items_itemId_active";
    `);

    await queryRunner.query(`
      ALTER TABLE "sale_items"
      ADD CONSTRAINT "UQ_sale_items_itemId" UNIQUE ("itemId");
    `);
  }
}

