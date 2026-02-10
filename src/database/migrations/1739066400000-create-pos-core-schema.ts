import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePosCoreSchema1739066400000 implements MigrationInterface {
  name = 'CreatePosCoreSchema1739066400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "inventory_items_condition_enum" AS ENUM ('GOOD', 'USED', 'BROKEN');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "inventory_items_status_enum" AS ENUM ('IN_STOCK', 'IN_REPAIR', 'READY_FOR_SALE', 'SOLD', 'RETURNED');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "purchases_paymentmethod_enum" AS ENUM ('CASH', 'CARD', 'OTHER');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "purchases_paymenttype_enum" AS ENUM ('PAID_NOW', 'PAY_LATER');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "repairs_status_enum" AS ENUM ('PENDING', 'DONE');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "sales_paymentmethod_enum" AS ENUM ('CASH', 'CARD', 'OTHER');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "sales_paymenttype_enum" AS ENUM ('PAID_NOW', 'PAY_LATER');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "payments_direction_enum" AS ENUM ('CUSTOMER_PAYS_SHOP', 'SHOP_PAYS_CUSTOMER');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "payments_method_enum" AS ENUM ('CASH', 'CARD', 'OTHER');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "payment_allocations_targettype_enum" AS ENUM ('SALE', 'PURCHASE');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "customers" (
        "id" SERIAL PRIMARY KEY,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "deletedAt" TIMESTAMPTZ,
        "isActive" boolean NOT NULL DEFAULT true,
        "fullName" character varying(120) NOT NULL,
        "phoneNumber" character varying(30) NOT NULL,
        "address" character varying(255),
        "passportId" character varying(50),
        "notes" text,
        CONSTRAINT "UQ_customers_phoneNumber" UNIQUE ("phoneNumber")
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "inventory_items" (
        "id" SERIAL PRIMARY KEY,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "deletedAt" TIMESTAMPTZ,
        "isActive" boolean NOT NULL DEFAULT true,
        "imei" character varying(40) NOT NULL,
        "serialNumber" character varying(50),
        "brand" character varying(80) NOT NULL,
        "model" character varying(80) NOT NULL,
        "storage" character varying(40),
        "color" character varying(40),
        "condition" "inventory_items_condition_enum" NOT NULL DEFAULT 'GOOD',
        "knownIssues" text,
        "status" "inventory_items_status_enum" NOT NULL DEFAULT 'IN_STOCK',
        "purchaseId" integer,
        "saleId" integer,
        CONSTRAINT "UQ_inventory_items_imei" UNIQUE ("imei")
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "purchases" (
        "id" SERIAL PRIMARY KEY,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "deletedAt" TIMESTAMPTZ,
        "isActive" boolean NOT NULL DEFAULT true,
        "purchasedAt" TIMESTAMPTZ NOT NULL,
        "customerId" integer,
        "paymentMethod" "purchases_paymentmethod_enum" NOT NULL,
        "paymentType" "purchases_paymenttype_enum" NOT NULL,
        "totalPrice" numeric(12,2) NOT NULL,
        "paidNow" numeric(12,2) NOT NULL DEFAULT 0,
        "remaining" numeric(12,2) NOT NULL DEFAULT 0,
        "notes" text
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "sales" (
        "id" SERIAL PRIMARY KEY,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "deletedAt" TIMESTAMPTZ,
        "isActive" boolean NOT NULL DEFAULT true,
        "soldAt" TIMESTAMPTZ NOT NULL,
        "customerId" integer,
        "paymentMethod" "sales_paymentmethod_enum" NOT NULL,
        "paymentType" "sales_paymenttype_enum" NOT NULL,
        "totalPrice" numeric(12,2) NOT NULL,
        "paidNow" numeric(12,2) NOT NULL DEFAULT 0,
        "remaining" numeric(12,2) NOT NULL DEFAULT 0,
        "notes" text
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "purchase_items" (
        "id" SERIAL PRIMARY KEY,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "deletedAt" TIMESTAMPTZ,
        "isActive" boolean NOT NULL DEFAULT true,
        "purchaseId" integer NOT NULL,
        "itemId" integer NOT NULL,
        "purchasePrice" numeric(12,2) NOT NULL,
        "notes" text,
        CONSTRAINT "UQ_purchase_items_itemId" UNIQUE ("itemId")
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "sale_items" (
        "id" SERIAL PRIMARY KEY,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "deletedAt" TIMESTAMPTZ,
        "isActive" boolean NOT NULL DEFAULT true,
        "saleId" integer NOT NULL,
        "itemId" integer NOT NULL,
        "salePrice" numeric(12,2) NOT NULL,
        "notes" text,
        CONSTRAINT "UQ_sale_items_itemId" UNIQUE ("itemId")
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "repairs" (
        "id" SERIAL PRIMARY KEY,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "deletedAt" TIMESTAMPTZ,
        "isActive" boolean NOT NULL DEFAULT true,
        "itemId" integer NOT NULL,
        "repairedAt" TIMESTAMPTZ NOT NULL,
        "description" text NOT NULL,
        "status" "repairs_status_enum" NOT NULL DEFAULT 'PENDING',
        "costTotal" numeric(12,2) NOT NULL,
        "partsCost" numeric(12,2),
        "laborCost" numeric(12,2),
        "technicianId" integer,
        "notes" text
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "payments" (
        "id" SERIAL PRIMARY KEY,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "deletedAt" TIMESTAMPTZ,
        "isActive" boolean NOT NULL DEFAULT true,
        "paidAt" TIMESTAMPTZ NOT NULL,
        "customerId" integer NOT NULL,
        "direction" "payments_direction_enum" NOT NULL,
        "amount" numeric(12,2) NOT NULL,
        "method" "payments_method_enum" NOT NULL,
        "notes" text
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "payment_allocations" (
        "id" SERIAL PRIMARY KEY,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "deletedAt" TIMESTAMPTZ,
        "isActive" boolean NOT NULL DEFAULT true,
        "paymentId" integer NOT NULL,
        "targetType" "payment_allocations_targettype_enum" NOT NULL,
        "targetSaleId" integer,
        "targetPurchaseId" integer,
        "amount" numeric(12,2) NOT NULL,
        CONSTRAINT "CHK_payment_allocations_target" CHECK (
          ("targetType" = 'SALE' AND "targetSaleId" IS NOT NULL AND "targetPurchaseId" IS NULL) OR
          ("targetType" = 'PURCHASE' AND "targetPurchaseId" IS NOT NULL AND "targetSaleId" IS NULL)
        )
      );
    `);

    await queryRunner.query(
      'CREATE UNIQUE INDEX IF NOT EXISTS "IDX_inventory_items_imei" ON "inventory_items" ("imei")',
    );
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "IDX_inventory_items_serialNumber" ON "inventory_items" ("serialNumber")',
    );
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "IDX_customers_phoneNumber" ON "customers" ("phoneNumber")',
    );
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "IDX_payment_allocations_sale_target" ON "payment_allocations" ("targetType", "targetSaleId")',
    );
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "IDX_payment_allocations_purchase_target" ON "payment_allocations" ("targetType", "targetPurchaseId")',
    );

    await queryRunner.query(`
      ALTER TABLE "purchases"
      ADD CONSTRAINT "FK_purchases_customerId"
      FOREIGN KEY ("customerId") REFERENCES "customers"("id")
      ON DELETE SET NULL ON UPDATE NO ACTION;
    `);

    await queryRunner.query(`
      ALTER TABLE "sales"
      ADD CONSTRAINT "FK_sales_customerId"
      FOREIGN KEY ("customerId") REFERENCES "customers"("id")
      ON DELETE SET NULL ON UPDATE NO ACTION;
    `);

    await queryRunner.query(`
      ALTER TABLE "purchase_items"
      ADD CONSTRAINT "FK_purchase_items_purchaseId"
      FOREIGN KEY ("purchaseId") REFERENCES "purchases"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION;
    `);

    await queryRunner.query(`
      ALTER TABLE "purchase_items"
      ADD CONSTRAINT "FK_purchase_items_itemId"
      FOREIGN KEY ("itemId") REFERENCES "inventory_items"("id")
      ON DELETE RESTRICT ON UPDATE NO ACTION;
    `);

    await queryRunner.query(`
      ALTER TABLE "sale_items"
      ADD CONSTRAINT "FK_sale_items_saleId"
      FOREIGN KEY ("saleId") REFERENCES "sales"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION;
    `);

    await queryRunner.query(`
      ALTER TABLE "sale_items"
      ADD CONSTRAINT "FK_sale_items_itemId"
      FOREIGN KEY ("itemId") REFERENCES "inventory_items"("id")
      ON DELETE RESTRICT ON UPDATE NO ACTION;
    `);

    await queryRunner.query(`
      ALTER TABLE "repairs"
      ADD CONSTRAINT "FK_repairs_itemId"
      FOREIGN KEY ("itemId") REFERENCES "inventory_items"("id")
      ON DELETE RESTRICT ON UPDATE NO ACTION;
    `);

    await queryRunner.query(`
      ALTER TABLE "repairs"
      ADD CONSTRAINT "FK_repairs_technicianId"
      FOREIGN KEY ("technicianId") REFERENCES "users"("id")
      ON DELETE SET NULL ON UPDATE NO ACTION;
    `);

    await queryRunner.query(`
      ALTER TABLE "payments"
      ADD CONSTRAINT "FK_payments_customerId"
      FOREIGN KEY ("customerId") REFERENCES "customers"("id")
      ON DELETE RESTRICT ON UPDATE NO ACTION;
    `);

    await queryRunner.query(`
      ALTER TABLE "payment_allocations"
      ADD CONSTRAINT "FK_payment_allocations_paymentId"
      FOREIGN KEY ("paymentId") REFERENCES "payments"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION;
    `);

    await queryRunner.query(`
      ALTER TABLE "payment_allocations"
      ADD CONSTRAINT "FK_payment_allocations_targetSaleId"
      FOREIGN KEY ("targetSaleId") REFERENCES "sales"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION;
    `);

    await queryRunner.query(`
      ALTER TABLE "payment_allocations"
      ADD CONSTRAINT "FK_payment_allocations_targetPurchaseId"
      FOREIGN KEY ("targetPurchaseId") REFERENCES "purchases"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION;
    `);

    await queryRunner.query(`
      ALTER TABLE "inventory_items"
      ADD CONSTRAINT "FK_inventory_items_purchaseId"
      FOREIGN KEY ("purchaseId") REFERENCES "purchases"("id")
      ON DELETE SET NULL ON UPDATE NO ACTION;
    `);

    await queryRunner.query(`
      ALTER TABLE "inventory_items"
      ADD CONSTRAINT "FK_inventory_items_saleId"
      FOREIGN KEY ("saleId") REFERENCES "sales"("id")
      ON DELETE SET NULL ON UPDATE NO ACTION;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "inventory_items" DROP CONSTRAINT IF EXISTS "FK_inventory_items_saleId"');
    await queryRunner.query('ALTER TABLE "inventory_items" DROP CONSTRAINT IF EXISTS "FK_inventory_items_purchaseId"');
    await queryRunner.query('ALTER TABLE "payment_allocations" DROP CONSTRAINT IF EXISTS "FK_payment_allocations_targetPurchaseId"');
    await queryRunner.query('ALTER TABLE "payment_allocations" DROP CONSTRAINT IF EXISTS "FK_payment_allocations_targetSaleId"');
    await queryRunner.query('ALTER TABLE "payment_allocations" DROP CONSTRAINT IF EXISTS "FK_payment_allocations_paymentId"');
    await queryRunner.query('ALTER TABLE "payments" DROP CONSTRAINT IF EXISTS "FK_payments_customerId"');
    await queryRunner.query('ALTER TABLE "repairs" DROP CONSTRAINT IF EXISTS "FK_repairs_technicianId"');
    await queryRunner.query('ALTER TABLE "repairs" DROP CONSTRAINT IF EXISTS "FK_repairs_itemId"');
    await queryRunner.query('ALTER TABLE "sale_items" DROP CONSTRAINT IF EXISTS "FK_sale_items_itemId"');
    await queryRunner.query('ALTER TABLE "sale_items" DROP CONSTRAINT IF EXISTS "FK_sale_items_saleId"');
    await queryRunner.query('ALTER TABLE "purchase_items" DROP CONSTRAINT IF EXISTS "FK_purchase_items_itemId"');
    await queryRunner.query('ALTER TABLE "purchase_items" DROP CONSTRAINT IF EXISTS "FK_purchase_items_purchaseId"');
    await queryRunner.query('ALTER TABLE "sales" DROP CONSTRAINT IF EXISTS "FK_sales_customerId"');
    await queryRunner.query('ALTER TABLE "purchases" DROP CONSTRAINT IF EXISTS "FK_purchases_customerId"');

    await queryRunner.query('DROP INDEX IF EXISTS "IDX_payment_allocations_purchase_target"');
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_payment_allocations_sale_target"');
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_customers_phoneNumber"');
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_inventory_items_serialNumber"');
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_inventory_items_imei"');

    await queryRunner.query('DROP TABLE IF EXISTS "payment_allocations"');
    await queryRunner.query('DROP TABLE IF EXISTS "payments"');
    await queryRunner.query('DROP TABLE IF EXISTS "repairs"');
    await queryRunner.query('DROP TABLE IF EXISTS "sale_items"');
    await queryRunner.query('DROP TABLE IF EXISTS "purchase_items"');
    await queryRunner.query('DROP TABLE IF EXISTS "sales"');
    await queryRunner.query('DROP TABLE IF EXISTS "purchases"');
    await queryRunner.query('DROP TABLE IF EXISTS "inventory_items"');
    await queryRunner.query('DROP TABLE IF EXISTS "customers"');

    await queryRunner.query('DROP TYPE IF EXISTS "payment_allocations_targettype_enum"');
    await queryRunner.query('DROP TYPE IF EXISTS "payments_method_enum"');
    await queryRunner.query('DROP TYPE IF EXISTS "payments_direction_enum"');
    await queryRunner.query('DROP TYPE IF EXISTS "sales_paymenttype_enum"');
    await queryRunner.query('DROP TYPE IF EXISTS "sales_paymentmethod_enum"');
    await queryRunner.query('DROP TYPE IF EXISTS "repairs_status_enum"');
    await queryRunner.query('DROP TYPE IF EXISTS "purchases_paymenttype_enum"');
    await queryRunner.query('DROP TYPE IF EXISTS "purchases_paymentmethod_enum"');
    await queryRunner.query('DROP TYPE IF EXISTS "inventory_items_status_enum"');
    await queryRunner.query('DROP TYPE IF EXISTS "inventory_items_condition_enum"');
  }
}
