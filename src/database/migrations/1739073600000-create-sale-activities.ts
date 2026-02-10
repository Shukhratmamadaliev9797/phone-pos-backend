import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSaleActivities1739073600000 implements MigrationInterface {
  name = 'CreateSaleActivities1739073600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "sale_activities" (
        "id" SERIAL PRIMARY KEY,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "deletedAt" TIMESTAMPTZ,
        "isActive" boolean NOT NULL DEFAULT true,
        "saleId" integer NOT NULL,
        "paidAt" TIMESTAMPTZ NOT NULL,
        "amount" numeric(12,2) NOT NULL,
        "notes" text
      );
    `);

    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "IDX_sale_activities_saleId" ON "sale_activities" ("saleId")',
    );
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "IDX_sale_activities_paidAt" ON "sale_activities" ("paidAt")',
    );

    await queryRunner.query(`
      ALTER TABLE "sale_activities"
      ADD CONSTRAINT "FK_sale_activities_saleId"
      FOREIGN KEY ("saleId") REFERENCES "sales"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "sale_activities"
      DROP CONSTRAINT IF EXISTS "FK_sale_activities_saleId";
    `);
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_sale_activities_paidAt";');
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_sale_activities_saleId";');
    await queryRunner.query('DROP TABLE IF EXISTS "sale_activities";');
  }
}
