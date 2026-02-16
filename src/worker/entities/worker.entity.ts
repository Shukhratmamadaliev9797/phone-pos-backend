import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  RelationId,
} from 'typeorm';
import { Extender } from 'src/common/entities/common.entites';
import { User } from 'src/user/user/entities/user.entity';
import { WorkerSalaryPayment } from './worker-salary-payment.entity';

export enum WorkerRole {
  MANAGER = 'MANAGER',
  CASHIER = 'CASHIER',
  TECHNICIAN = 'TECHNICIAN',
  OTHER = 'OTHER',
}

export enum WorkerSalaryType {
  MONTHLY = 'MONTHLY',
  PERCENT = 'PERCENT',
}

@Entity({ name: 'workers' })
export class Worker extends Extender {
  @Column({ type: 'varchar', length: 120 })
  fullName: string;

  @Column({ type: 'varchar', length: 30, nullable: true })
  phoneNumber: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  address: string | null;

  @Column({ type: 'numeric', precision: 12, scale: 2, default: 0 })
  monthlySalary: string;

  @Column({
    type: 'enum',
    enum: WorkerSalaryType,
    default: WorkerSalaryType.MONTHLY,
  })
  salaryType: WorkerSalaryType;

  @Column({ type: 'numeric', precision: 5, scale: 2, nullable: true })
  salaryPercent: string | null;

  @Column({ type: 'int', default: 0 })
  soldPhonesCount: number;

  @Column({ type: 'numeric', precision: 14, scale: 2, default: 0 })
  totalSoldAmount: string;

  @Column({ type: 'numeric', precision: 14, scale: 2, default: 0 })
  totalProfitAmount: string;

  @Column({ type: 'numeric', precision: 14, scale: 2, default: 0 })
  percentSalaryAccrued: string;

  @Column({ type: 'enum', enum: WorkerRole, default: WorkerRole.OTHER })
  workerRole: WorkerRole;

  @Column({ type: 'boolean', default: false })
  hasDashboardAccess: boolean;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'userId' })
  user: User | null;

  @RelationId((entity: Worker) => entity.user)
  userId: number | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @OneToMany(() => WorkerSalaryPayment, (payment) => payment.worker)
  salaryPayments?: WorkerSalaryPayment[];
}
