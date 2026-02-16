import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  RelationId,
} from 'typeorm';
import { Extender } from 'src/common/entities/common.entites';
import { Customer } from 'src/customer/entities/customer.entity';
import { Worker } from 'src/worker/entities/worker.entity';
import { SaleActivity } from './sale-activity.entity';
import { SaleItem } from './sale-item.entity';

export enum SalePaymentMethod {
  CASH = 'CASH',
  CARD = 'CARD',
  OTHER = 'OTHER',
}

export enum SalePaymentType {
  PAID_NOW = 'PAID_NOW',
  PAY_LATER = 'PAY_LATER',
}

@Entity({ name: 'sales' })
export class Sale extends Extender {
  @Column({ type: 'timestamptz' })
  soldAt: Date;

  @ManyToOne(() => Customer, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'customerId' })
  customer: Customer | null;

  @RelationId((entity: Sale) => entity.customer)
  customerId: number | null;

  @ManyToOne(() => Worker, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'sellerWorkerId' })
  sellerWorker: Worker | null;

  @RelationId((entity: Sale) => entity.sellerWorker)
  sellerWorkerId: number | null;

  @Column({ type: 'enum', enum: SalePaymentMethod })
  paymentMethod: SalePaymentMethod;

  @Column({ type: 'enum', enum: SalePaymentType })
  paymentType: SalePaymentType;

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  totalPrice: string;

  @Column({ type: 'numeric', precision: 12, scale: 2, default: 0 })
  paidNow: string;

  @Column({ type: 'numeric', precision: 12, scale: 2, default: 0 })
  remaining: string;

  @Column({ type: 'int', nullable: true })
  installmentMonths: number | null;

  @Column({ type: 'boolean', nullable: true })
  firstPaymentNow: boolean | null;

  @Column({ type: 'numeric', precision: 12, scale: 2, nullable: true })
  monthlyInstallmentAmount: string | null;

  @Column({ type: 'numeric', precision: 12, scale: 2, nullable: true })
  profit: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @OneToMany(() => SaleItem, (item) => item.sale)
  items: SaleItem[];

  @OneToMany(() => SaleActivity, (activity) => activity.sale)
  activities: SaleActivity[];
}
