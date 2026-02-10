import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePurchaseActivities1739074200000
  implements MigrationInterface
{
  name = 'CreatePurchaseActivities1739074200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "purchase_activities" (
        "id" SERIAL PRIMARY KEY,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "deletedAt" TIMESTAMPTZ,
        "isActive" boolean NOT NULL DEFAULT true,
        "purchaseId" integer NOT NULL,
        "paidAt" TIMESTAMPTZ NOT NULL,
        "amount" numeric(12,2) NOT NULL,
        "notes" text
      );
    `);

    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "IDX_purchase_activities_purchaseId" ON "purchase_activities" ("purchaseId")',
    );
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "IDX_purchase_activities_paidAt" ON "purchase_activities" ("paidAt")',
    );

    await queryRunner.query(`
      ALTER TABLE "purchase_activities"
      ADD CONSTRAINT "FK_purchase_activities_purchaseId"
      FOREIGN KEY ("purchaseId") REFERENCES "purchases"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "purchase_activities"
      DROP CONSTRAINT IF EXISTS "FK_purchase_activities_purchaseId";
    `);
    await queryRunner.query(
      'DROP INDEX IF EXISTS "IDX_purchase_activities_paidAt";',
    );
    await queryRunner.query(
      'DROP INDEX IF EXISTS "IDX_purchase_activities_purchaseId";',
    );
    await queryRunner.query('DROP TABLE IF EXISTS "purchase_activities";');
  }
}
