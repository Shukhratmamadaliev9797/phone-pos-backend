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

  const users: SeedUser[] = [
    {
      email: adminEmail,
      fullName: 'Joyce Waller',
      role: UserRole.OWNER_ADMIN,
      plainPassword: adminPassword,
      phoneNumber: '+998900000001',
      address: 'Tashkent, Yunusobod',
    },

    {
      email: 'cashier@shop.com',
      fullName: 'Taylor Bond',
      role: UserRole.CASHIER,
      plainPassword: 'Cashier123',
      phoneNumber: '+998900000002',
      address: 'Tashkent, Chilonzor',
    },
    {
      email: 'tech@shop.com',
      fullName: 'Dani Johns',
      role: UserRole.TECHNICIAN,
      plainPassword: 'Tech123',
      phoneNumber: '+998900000003',
      address: 'Tashkent, Sergeli',
    },
  ];

  return users;
}

export async function seedPosUsers(dataSource: DataSource): Promise<number> {
  const users = buildSeedUsers();

  for (const user of users) {
    const passwordHash = await hashPassword(user.plainPassword);

    await dataSource
      .createQueryBuilder()
      .insert()
      .into('users')
      .values({
        email: user.email,
        username: emailToUsername(user.email),
        fullName: user.fullName,
        phoneNumber: user.phoneNumber,
        address: user.address,
        role: user.role,
        passwordHash,
        refreshTokenVersion: 0,
        isActive: true,
        deletedAt: null,
      })
      .onConflict(
        `("email") DO UPDATE SET
        "fullName" = EXCLUDED."fullName",
        "username" = EXCLUDED."username",
        "phoneNumber" = EXCLUDED."phoneNumber",
        "address" = EXCLUDED."address",
        "role" = EXCLUDED."role",
        "passwordHash" = EXCLUDED."passwordHash",
        "isActive" = TRUE,
        "deletedAt" = NULL`,
      )
      .execute();
  }

  return users.length;
}
