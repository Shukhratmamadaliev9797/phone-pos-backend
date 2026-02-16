import { DataSource } from 'typeorm';
import { hashPassword } from 'src/auth/helper';
import { UserRole } from 'src/user/user/entities/user.entity';

type SeedUser = {
  email: string;
  fullName: string;
  role: UserRole;
  plainPassword: string;
  phoneNumber: string;
  address: string;
};

export type PosSeedSummary = {
  users: number;
  workers: number;
  customers: number;
  inventoryItems: number;
  purchases: number;
  purchasePayments: number;
  repairs: number;
  repairEntries: number;
  sales: number;
  salePayments: number;
  salaryPayments: number;
};

function emailToUsername(email: string): string {
  return email.split('@')[0];
}

function envOrDefault(key: string, fallback: string): string {
  const value = process.env[key];
  if (!value || value.trim().length === 0) {
    return fallback;
  }
  return value.trim();
}

function buildSeedUsers(): SeedUser[] {
  const adminEmail = envOrDefault('ADMIN_EMAIL', 'admin@shop.com');
  const adminPassword = envOrDefault('ADMIN_PASSWORD', 'Admin123');

  return [
    {
      email: adminEmail,
      fullName: envOrDefault('ADMIN_FULL_NAME', 'Admin User'),
      role: UserRole.OWNER_ADMIN,
      plainPassword: adminPassword,
      phoneNumber: envOrDefault('ADMIN_PHONE', '+998900000001'),
      address: envOrDefault('ADMIN_ADDRESS', 'Tashkent'),
    },
  ];
}

async function upsertUsers(dataSource: DataSource, users: SeedUser[]): Promise<void> {
  for (const user of users) {
    const passwordHash = await hashPassword(user.plainPassword);
    const username = emailToUsername(user.email);

    const existing = await dataSource
      .createQueryBuilder()
      .select('u.id', 'id')
      .from('users', 'u')
      .where('u.username = :username', { username })
      .orWhere('u.email = :email', { email: user.email })
      .orderBy('CASE WHEN u.username = :username THEN 0 ELSE 1 END', 'ASC')
      .setParameter('username', username)
      .limit(1)
      .getRawOne<{ id: number }>();

    if (existing?.id) {
      await dataSource
        .createQueryBuilder()
        .update('users')
        .set({
          email: user.email,
          username,
          fullName: user.fullName,
          phoneNumber: user.phoneNumber,
          address: user.address,
          role: user.role,
          passwordHash,
          refreshTokenVersion: 0,
          isActive: true,
          deletedAt: null,
        })
        .where('id = :id', { id: existing.id })
        .execute();
      continue;
    }

    await dataSource
      .createQueryBuilder()
      .insert()
      .into('users')
      .values({
        email: user.email,
        username,
        fullName: user.fullName,
        phoneNumber: user.phoneNumber,
        address: user.address,
        role: user.role,
        passwordHash,
        refreshTokenVersion: 0,
        isActive: true,
        deletedAt: null,
      })
      .execute();
  }
}

export async function seedPosUsers(dataSource: DataSource): Promise<PosSeedSummary> {
  const users = buildSeedUsers();
  await upsertUsers(dataSource, users);

  return {
    users: users.length,
    workers: 0,
    customers: 0,
    inventoryItems: 0,
    purchases: 0,
    purchasePayments: 0,
    repairs: 0,
    repairEntries: 0,
    sales: 0,
    salePayments: 0,
    salaryPayments: 0,
  };
}
