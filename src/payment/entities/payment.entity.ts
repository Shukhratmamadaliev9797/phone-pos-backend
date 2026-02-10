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
import { PaymentAllocation } from './payment-allocation.entity';

export enum PaymentDirection {
  CUSTOMER_PAYS_SHOP = 'CUSTOMER_PAYS_SHOP',
  SHOP_PAYS_CUSTOMER = 'SHOP_PAYS_CUSTOMER',
}

export enum PaymentMethod {
  CASH = 'CASH',
  CARD = 'CARD',
  OTHER = 'OTHER',
}

@Entity({ name: 'payments' })
export class Payment extends Extender {
  @Column({ type: 'timestamptz' })
  paidAt: Date;

  @ManyToOne(() => Customer, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'customerId' })
  customer: Customer;

  @RelationId((entity: Payment) => entity.customer)
  customerId: number;

  @Column({ type: 'enum', enum: PaymentDirection })
  direction: PaymentDirection;

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  amount: string;

  @Column({ type: 'enum', enum: PaymentMethod })
  method: PaymentMethod;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @OneToMany(() => PaymentAllocation, (allocation) => allocation.payment)
  allocations: PaymentAllocation[];
}
