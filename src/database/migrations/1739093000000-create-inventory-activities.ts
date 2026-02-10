import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateInventoryActivities1739093000000
  implements MigrationInterface
{
  name = 'CreateInventoryActivities1739093000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "inventory_activities_type_enum" AS ENUM ('CREATED', 'PURCHASED', 'SOLD', 'STATUS_CHANGED', 'MOVED_TO_REPAIR', 'MARKED_DONE');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "inventory_activities" (
        "id" SERIAL PRIMARY KEY,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "deletedAt" TIMESTAMPTZ,
        "isActive" boolean NOT NULL DEFAULT true,
        "itemId" integer NOT NULL,
        "type" "inventory_activities_type_enum" NOT NULL DEFAULT 'STATUS_CHANGED',
        "fromStatus" "inventory_items_status_enum",
        "toStatus" "inventory_items_status_enum" NOT NULL,
        "notes" text,
        "happenedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_inventory_activities_itemId_happenedAt"
      ON "inventory_activities" ("itemId", "happenedAt");
    `);

    await queryRunner.query(`
      ALTER TABLE "inventory_activities"
      ADD CONSTRAINT "FK_inventory_activities_itemId"
      FOREIGN KEY ("itemId") REFERENCES "inventory_items"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "inventory_activities" DROP CONSTRAINT IF EXISTS "FK_inventory_activities_itemId"',
    );
    await queryRunner.query(
      'DROP INDEX IF EXISTS "IDX_inventory_activities_itemId_happenedAt"',
    );
    await queryRunner.query('DROP TABLE IF EXISTS "inventory_activities"');
    await queryRunner.query('DROP TYPE IF EXISTS "inventory_activities_type_enum"');
  }
}
