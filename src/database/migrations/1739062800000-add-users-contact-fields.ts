import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUsersContactFields1739062800000
  implements MigrationInterface
{
  name = 'AddUsersContactFields1739062800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "phoneNumber" character varying(30)',
    );
    await queryRunner.query(
      'ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "address" character varying(255)',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "users" DROP COLUMN IF EXISTS "address"',
    );
  }
}
