import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateWorkersAndSalaryPayments1739077000000
  implements MigrationInterface
{
  name = 'CreateWorkersAndSalaryPayments1739077000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "workers_workerrole_enum" AS ENUM ('MANAGER', 'CASHIER', 'TECHNICIAN', 'OTHER');
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "workers" (
        "id" SERIAL PRIMARY KEY,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "deletedAt" TIMESTAMPTZ,
        "isActive" boolean NOT NULL DEFAULT true,
        "fullName" varchar(120) NOT NULL,
        "phoneNumber" varchar(30) NOT NULL,
        "address" varchar(255),
        "monthlySalary" numeric(12,2) NOT NULL DEFAULT 0,
        "workerRole" "workers_workerrole_enum" NOT NULL DEFAULT 'OTHER',
        "hasDashboardAccess" boolean NOT NULL DEFAULT false,
        "userId" integer,
        "notes" text,
        CONSTRAINT "UQ_workers_phoneNumber" UNIQUE ("phoneNumber"),
        CONSTRAINT "UQ_workers_userId" UNIQUE ("userId")
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "worker_salary_payments" (
        "id" SERIAL PRIMARY KEY,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "deletedAt" TIMESTAMPTZ,
        "isActive" boolean NOT NULL DEFAULT true,
        "workerId" integer NOT NULL,
        "month" varchar(7) NOT NULL,
        "amountPaid" numeric(12,2) NOT NULL,
        "paidAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "notes" text
      );
    `);

    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "IDX_workers_phoneNumber" ON "workers" ("phoneNumber")',
    );
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "IDX_worker_salary_payments_workerId" ON "worker_salary_payments" ("workerId")',
    );
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "IDX_worker_salary_payments_month" ON "worker_salary_payments" ("month")',
    );

    await queryRunner.query(`
      ALTER TABLE "workers"
      ADD CONSTRAINT "FK_workers_userId"
      FOREIGN KEY ("userId") REFERENCES "users"("id")
      ON DELETE SET NULL ON UPDATE NO ACTION;
    `);

    await queryRunner.query(`
      ALTER TABLE "worker_salary_payments"
      ADD CONSTRAINT "FK_worker_salary_payments_workerId"
      FOREIGN KEY ("workerId") REFERENCES "workers"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "worker_salary_payments" DROP CONSTRAINT IF EXISTS "FK_worker_salary_payments_workerId";',
    );
    await queryRunner.query(
      'ALTER TABLE "workers" DROP CONSTRAINT IF EXISTS "FK_workers_userId";',
    );

    await queryRunner.query(
      'DROP INDEX IF EXISTS "IDX_worker_salary_payments_month";',
    );
    await queryRunner.query(
      'DROP INDEX IF EXISTS "IDX_worker_salary_payments_workerId";',
    );
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_workers_phoneNumber";');

    await queryRunner.query('DROP TABLE IF EXISTS "worker_salary_payments";');
    await queryRunner.query('DROP TABLE IF EXISTS "workers";');
    await queryRunner.query('DROP TYPE IF EXISTS "workers_workerrole_enum";');
  }
}
