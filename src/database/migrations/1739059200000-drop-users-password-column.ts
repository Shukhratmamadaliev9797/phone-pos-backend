import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropUsersPasswordColumn1739059200000
  implements MigrationInterface
{
  name = 'DropUsersPasswordColumn1739059200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "users" DROP COLUMN IF EXISTS "password"',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "users" ADD COLUMN "password" character varying',
    );
  }
}
