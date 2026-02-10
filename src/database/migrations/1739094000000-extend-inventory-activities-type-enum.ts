import { MigrationInterface, QueryRunner } from 'typeorm';

export class ExtendInventoryActivitiesTypeEnum1739094000000
  implements MigrationInterface
{
  name = 'ExtendInventoryActivitiesTypeEnum1739094000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TYPE "inventory_activities_type_enum"
      ADD VALUE IF NOT EXISTS 'CREATED';
    `);
    await queryRunner.query(`
      ALTER TYPE "inventory_activities_type_enum"
      ADD VALUE IF NOT EXISTS 'PURCHASED';
    `);
    await queryRunner.query(`
      ALTER TYPE "inventory_activities_type_enum"
      ADD VALUE IF NOT EXISTS 'SOLD';
    `);
  }

  public async down(): Promise<void> {
    // Postgres enum values cannot be removed safely in down migration without type recreation.
  }
}
