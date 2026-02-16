import { config as loadEnv } from 'dotenv';
import { resolve } from 'path';
import { DataSource } from 'typeorm';
import { User } from 'src/user/user/entities/user.entity';
import { seedPosUsers } from 'src/database/seeds/seed-pos-users';

const envPath = resolve(__dirname, '../../.env');
loadEnv({ path: envPath, override: true });

type RequiredDbEnv = {
  DB_HOST: string;
  DB_PORT: string;
  DB_USER: string;
  DB_PASSWORD: string;
  DB_NAME: string;
};

function getDatabaseConfig():
  | { url: string; ssl: { rejectUnauthorized: false } }
  | ({
      url?: never;
      ssl?: never;
    } & RequiredDbEnv) {
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
      `Seed configuration error. Set DATABASE_URL or provide local DB vars: ${missing.join(', ')}`,
    );
  }

  return {
    DB_HOST: process.env.DB_HOST!,
    DB_PORT: process.env.DB_PORT!,
    DB_USER: process.env.DB_USER!,
    DB_PASSWORD: process.env.DB_PASSWORD!,
    DB_NAME: process.env.DB_NAME!,
  };
}

let dataSource: DataSource | null = null;

async function run() {
  const shouldReseed = process.argv.includes('--reseed');
  const dbConfig = getDatabaseConfig();

  if (process.env.APP_ENV !== 'production') {
    if ('url' in dbConfig) {
      console.log('[seed] Database connection config', {
        DATABASE_URL: '[set]',
        SSL: 'enabled',
      });
    } else {
      console.log('[seed] Database connection config', {
        DB_HOST: dbConfig.DB_HOST,
        DB_PORT: dbConfig.DB_PORT,
        DB_USER: dbConfig.DB_USER,
        DB_NAME: dbConfig.DB_NAME,
      });
    }
  }

  dataSource = new DataSource({
    type: 'postgres',
    ...('url' in dbConfig
      ? {
          url: dbConfig.url,
          ssl: dbConfig.ssl,
        }
      : {
          host: dbConfig.DB_HOST,
          port: Number(dbConfig.DB_PORT),
          username: dbConfig.DB_USER,
          password: dbConfig.DB_PASSWORD,
          database: dbConfig.DB_NAME,
        }),
    entities: [User],
    synchronize: false,
  });

  await dataSource.initialize();

  if (shouldReseed) {
    await dataSource.query(`
      TRUNCATE TABLE
        "sale_activities",
        "sale_items",
        "sales",
        "repair_entries",
        "repairs",
        "purchase_activities",
        "purchase_items",
        "purchases",
        "inventory_activities",
        "inventory_items",
        "worker_salary_payments",
        "workers",
        "customers",
        "support_requests",
        "users"
      RESTART IDENTITY CASCADE
    `);
  }

  const summary = await seedPosUsers(dataSource);
  await dataSource.destroy();

  const mode = shouldReseed ? 'reseeded' : 'seeded';
  console.log(`Successfully ${mode} POS test data`);
  console.log('[seed] Summary', summary);
}

void run().catch(async (error: unknown) => {
  console.error('Failed to run seed', error);
  if (dataSource?.isInitialized) {
    await dataSource.destroy();
  }
  process.exit(1);
});
