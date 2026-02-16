import { config as loadEnv } from 'dotenv';
import { resolve } from 'path';
import { DataSource } from 'typeorm';
import { Customer } from 'src/customer/entities/customer.entity';
import { InventoryItem } from 'src/inventory/entities/inventory-item.entity';
import { InventoryActivity } from 'src/inventory/entities/inventory-activity.entity';
import { PaymentAllocation } from 'src/payment/entities/payment-allocation.entity';
import { Payment } from 'src/payment/entities/payment.entity';
import { PurchaseItem } from 'src/purchase/entities/purchase-item.entity';
import { PurchaseActivity } from 'src/purchase/entities/purchase-activity.entity';
import { Purchase } from 'src/purchase/entities/purchase.entity';
import { Repair } from 'src/repair/entities/repair.entity';
import { RepairEntry } from 'src/repair/entities/repair-entry.entity';
import { SaleItem } from 'src/sale/entities/sale-item.entity';
import { SaleActivity } from 'src/sale/entities/sale-activity.entity';
import { Sale } from 'src/sale/entities/sale.entity';
import { User } from 'src/user/user/entities/user.entity';
import { SupportRequest } from 'src/support-request/entities/support-request.entity';
import { DashboardMetric } from 'src/dashboard/entities/dashboard-metric.entity';
import { WorkerSalaryPayment } from 'src/worker/entities/worker-salary-payment.entity';
import { Worker } from 'src/worker/entities/worker.entity';
import { CreatePosCoreSchema1739066400000 } from './1739066400000-create-pos-core-schema';
import { CreatePurchaseActivities1739074200000 } from './1739074200000-create-purchase-activities';
import { CreateSaleActivities1739073600000 } from './1739073600000-create-sale-activities';
import { CreateRepairEntries1739075000000 } from './1739075000000-create-repair-entries';
import { CreateWorkersAndSalaryPayments1739077000000 } from './1739077000000-create-workers-and-salary-payments';
import { AddUsersContactFields1739062800000 } from './1739062800000-add-users-contact-fields';
import { DropUsersPasswordColumn1739059200000 } from './1739059200000-drop-users-password-column';
import { AddInventoryExpectedSalePrice1739082000000 } from './1739082000000-add-inventory-expected-sale-price';
import { CreateSupportRequests1739090000000 } from './1739090000000-create-support-requests';
import { AddSupportRequestReadStatus1739091000000 } from './1739091000000-add-support-request-read-status';
import { CreateInventoryActivities1739093000000 } from './1739093000000-create-inventory-activities';
import { ExtendInventoryActivitiesTypeEnum1739094000000 } from './1739094000000-extend-inventory-activities-type-enum';
import { FixSaleItemUniqueActiveIndex1739195000000 } from './1739195000000-fix-sale-item-unique-active-index';
import { AddSaleInstallmentFields1739300000000 } from './1739300000000-add-sale-installment-fields';
import { AddSaleProfit1739301000000 } from './1739301000000-add-sale-profit';
import { AddWorkerSalaryType1739302000000 } from './1739302000000-add-worker-salary-type';
import { AddSaleSellerAndWorkerSalesStats1739303000000 } from './1739303000000-add-sale-seller-and-worker-sales-stats';
import { AddWorkerTotalProfitAmount1739530000000 } from './1739530000000-add-worker-total-profit-amount';
import { MakeWorkerPhoneOptional1739532000000 } from './1739532000000-make-worker-phone-optional';
import { CreateDashboardMetrics1739600000000 } from './1739600000000-create-dashboard-metrics';
import { AddSaleRevenueDashboardMetricType1739601000000 } from './1739601000000-add-sale-revenue-dashboard-metric-type';
import { AddDashboardEventMetricTypes1739602000000 } from './1739602000000-add-dashboard-event-metric-types';
import { AddInventoryMetricTypes1739603000000 } from './1739603000000-add-inventory-metric-types';
import { DropDashboardMetrics1739604000000 } from './1739604000000-drop-dashboard-metrics';

const envPath = resolve(__dirname, '../../../.env');
loadEnv({ path: envPath, override: true });

function getDatabaseConfig():
  | { url: string; ssl: { rejectUnauthorized: false } }
  | {
      host: string;
      port: number;
      username: string;
      password: string;
      database: string;
    } {
  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (databaseUrl) {
    return {
      url: databaseUrl,
      ssl: { rejectUnauthorized: false },
    };
  }

  const requiredLocalKeys = [
    'DB_HOST',
    'DB_PORT',
    'DB_USER',
    'DB_PASSWORD',
    'DB_NAME',
  ] as const;

  const missing = requiredLocalKeys.filter((key) => {
    const value = process.env[key];
    return typeof value !== 'string' || value.trim().length === 0;
  });

  if (missing.length > 0) {
    throw new Error(
      `Migration configuration error. Set DATABASE_URL or provide local DB vars: ${missing.join(', ')}`,
    );
  }

  return {
    host: process.env.DB_HOST!,
    port: Number(process.env.DB_PORT!),
    username: process.env.DB_USER!,
    password: process.env.DB_PASSWORD!,
    database: process.env.DB_NAME!,
  };
}

const dbConfig = getDatabaseConfig();

const dataSource = new DataSource({
  type: 'postgres',
  ...('url' in dbConfig
    ? {
        url: dbConfig.url,
        ssl: dbConfig.ssl,
      }
    : dbConfig),
  entities: [
    User,
    Customer,
    InventoryItem,
    InventoryActivity,
    Purchase,
    PurchaseItem,
    PurchaseActivity,
    Repair,
    RepairEntry,
    Sale,
    SaleItem,
    SaleActivity,
    Payment,
    PaymentAllocation,
    Worker,
    WorkerSalaryPayment,
    SupportRequest,
    DashboardMetric,
  ],
  migrations: [
    DropUsersPasswordColumn1739059200000,
    AddUsersContactFields1739062800000,
    CreatePosCoreSchema1739066400000,
    CreateRepairEntries1739075000000,
    CreateWorkersAndSalaryPayments1739077000000,
    CreateSaleActivities1739073600000,
    CreatePurchaseActivities1739074200000,
    AddInventoryExpectedSalePrice1739082000000,
    CreateSupportRequests1739090000000,
    AddSupportRequestReadStatus1739091000000,
    CreateInventoryActivities1739093000000,
    ExtendInventoryActivitiesTypeEnum1739094000000,
    FixSaleItemUniqueActiveIndex1739195000000,
    AddSaleInstallmentFields1739300000000,
    AddSaleProfit1739301000000,
    AddWorkerSalaryType1739302000000,
    AddSaleSellerAndWorkerSalesStats1739303000000,
    AddWorkerTotalProfitAmount1739530000000,
    MakeWorkerPhoneOptional1739532000000,
    CreateDashboardMetrics1739600000000,
    AddSaleRevenueDashboardMetricType1739601000000,
    AddDashboardEventMetricTypes1739602000000,
    AddInventoryMetricTypes1739603000000,
    DropDashboardMetrics1739604000000,
  ],
  synchronize: false,
});

async function runMigrations() {
  await dataSource.initialize();
  await dataSource.runMigrations();
  await dataSource.destroy();
  console.log('Migrations completed');
}

void runMigrations().catch(async (error: unknown) => {
  console.error('Migration failed', error);
  if (dataSource.isInitialized) {
    await dataSource.destroy();
  }
  process.exit(1);
});
