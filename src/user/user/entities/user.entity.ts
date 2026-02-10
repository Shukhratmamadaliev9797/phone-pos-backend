import { Column, Entity, Index } from 'typeorm';
import { Extender } from 'src/common/entities/common.entites';

export enum UserRole {
  OWNER_ADMIN = 'OWNER_ADMIN',
  MANAGER = 'MANAGER',
  CASHIER = 'CASHIER',
  TECHNICIAN = 'TECHNICIAN',
}

@Entity({ name: 'users' })
export class User extends Extender {
  @Index({ unique: true })
  @Column({ type: 'varchar', length: 120, nullable: true })
  email: string | null;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 80 })
  username: string;

  @Column({ type: 'varchar', length: 120 })
  fullName: string;

  @Column({ type: 'varchar', select: false })
  passwordHash: string;

  @Column({ type: 'varchar', length: 30, nullable: true })
  phoneNumber: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  address: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  lastLoginAt: Date | null;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.CASHIER })
  role: UserRole;

  @Column({ default: 0 })
  refreshTokenVersion: number;
}
