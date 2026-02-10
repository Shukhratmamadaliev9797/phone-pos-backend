import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { CustomerModule } from './customer/customer.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { InventoryModule } from './inventory/inventory.module';
import { PaymentModule } from './payment/payment.module';
import { PurchaseModule } from './purchase/purchase.module';
import { RepairModule } from './repair/repair.module';
import { ReportsModule } from './reports/reports.module';
import { SaleModule } from './sale/sale.module';
import { UserModule } from './user/user/user.module';
import { WorkerModule } from './worker/worker.module';
import { SupportRequestModule } from './support-request/support-request.module';

type EnvVars = {
  APP_ENV?: string;
  DATABASE_URL?: string;
  DB_HOST?: string;
  DB_PORT?: string;
  DB_USER?: string;
  DB_PASSWORD?: string;
  DB_NAME?: string;
  JWT_SECRET?: string;
  JWT_REFRESH_SECRET?: string;
  [key: string]: unknown;
};

function validateEnvironment(env: EnvVars): EnvVars {
  const requiredJwt = ['JWT_SECRET', 'JWT_REFRESH_SECRET'] as const;

  const missingJwt = requiredJwt.filter((key) => {
    const value = env[key];
    return typeof value !== 'string' || value.trim().length === 0;
  });

  if (missingJwt.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingJwt.join(', ')}`,
    );
  }

  const hasDatabaseUrl =
    typeof env.DATABASE_URL === 'string' && env.DATABASE_URL.trim().length > 0;

  if (!hasDatabaseUrl) {
    const requiredLocalDb = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'] as const;
    const missingLocalDb = requiredLocalDb.filter((key) => {
      const value = env[key];
      return typeof value !== 'string' || value.trim().length === 0;
    });

    if (missingLocalDb.length > 0) {
      throw new Error(
        `Missing required environment variables: ${missingLocalDb.join(', ')} (or set DATABASE_URL)`,
      );
    }
  }

  return env;
}

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validate: validateEnvironment,
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const databaseUrl = config.get<string>('DATABASE_URL', { infer: true });
        const hasDatabaseUrl =
          typeof databaseUrl === 'string' && databaseUrl.trim().length > 0;

        return {
          type: 'postgres' as const,
          ...(hasDatabaseUrl
            ? {
                url: databaseUrl,
                ssl: { rejectUnauthorized: false },
              }
            : {
                host: config.get<string>('DB_HOST', { infer: true }),
                port: Number(config.get<string>('DB_PORT', { infer: true }) ?? 5432),
                username: config.get<string>('DB_USER', { infer: true }),
                password: config.get<string>('DB_PASSWORD', { infer: true }),
                database: config.get<string>('DB_NAME', { infer: true }),
              }),
          autoLoadEntities: true,
          synchronize: false,
          logging:
            (config.get<string>('APP_ENV', { infer: true }) ?? 'development') !==
            'production',
        };
      },
    }),
    UserModule,
    AuthModule,
    DashboardModule,
    CustomerModule,
    InventoryModule,
    PurchaseModule,
    RepairModule,
    ReportsModule,
    SaleModule,
    PaymentModule,
    WorkerModule,
    SupportRequestModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
