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
import { PurchaseActivity } from './purchase-activity.entity';
import { PurchaseItem } from './purchase-item.entity';

export enum PurchasePaymentMethod {
  CASH = 'CASH',
  CARD = 'CARD',
  OTHER = 'OTHER',
}

export enum PurchasePaymentType {
  PAID_NOW = 'PAID_NOW',
  PAY_LATER = 'PAY_LATER',
}

@Entity({ name: 'purchases' })
export class Purchase extends Extender {
  @Column({ type: 'timestamptz' })
  purchasedAt: Date;

  @ManyToOne(() => Customer, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'customerId' })
  customer: Customer | null;

  @RelationId((entity: Purchase) => entity.customer)
  customerId: number | null;

  @Column({ type: 'enum', enum: PurchasePaymentMethod })
  paymentMethod: PurchasePaymentMethod;

  @Column({ type: 'enum', enum: PurchasePaymentType })
  paymentType: PurchasePaymentType;

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  totalPrice: string;

  @Column({ type: 'numeric', precision: 12, scale: 2, default: 0 })
  paidNow: string;

  @Column({ type: 'numeric', precision: 12, scale: 2, default: 0 })
  remaining: string;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @OneToMany(() => PurchaseItem, (item) => item.purchase)
  items: PurchaseItem[];

  @OneToMany(() => PurchaseActivity, (activity) => activity.purchase)
  activities: PurchaseActivity[];
}
