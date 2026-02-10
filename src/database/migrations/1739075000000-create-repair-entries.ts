import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateRepairEntries1739075000000 implements MigrationInterface {
  name = 'CreateRepairEntries1739075000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "repair_entries" (
        "id" SERIAL PRIMARY KEY,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "deletedAt" TIMESTAMPTZ,
        "isActive" boolean NOT NULL DEFAULT true,
        "repairId" integer NOT NULL,
        "entryAt" TIMESTAMPTZ NOT NULL,
        "description" text NOT NULL,
        "costTotal" numeric(12,2) NOT NULL,
        "partsCost" numeric(12,2),
        "laborCost" numeric(12,2),
        "notes" text
      );
    `);

    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "IDX_repair_entries_repairId" ON "repair_entries" ("repairId")',
    );
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "IDX_repair_entries_entryAt" ON "repair_entries" ("entryAt")',
    );

    await queryRunner.query(`
      ALTER TABLE "repair_entries"
      ADD CONSTRAINT "FK_repair_entries_repairId"
      FOREIGN KEY ("repairId") REFERENCES "repairs"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "repair_entries" DROP CONSTRAINT IF EXISTS "FK_repair_entries_repairId";',
    );
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_repair_entries_entryAt";');
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_repair_entries_repairId";');
    await queryRunner.query('DROP TABLE IF EXISTS "repair_entries";');
  }
}
