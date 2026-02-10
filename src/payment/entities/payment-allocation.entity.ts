import {
  Check,
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  RelationId,
} from 'typeorm';
import { Extender } from 'src/common/entities/common.entites';
import { Purchase } from 'src/purchase/entities/purchase.entity';
import { Sale } from 'src/sale/entities/sale.entity';
import { Payment } from './payment.entity';

export enum PaymentAllocationTargetType {
  SALE = 'SALE',
  PURCHASE = 'PURCHASE',
}

@Entity({ name: 'payment_allocations' })
@Index('IDX_payment_allocations_sale_target', ['targetType', 'targetSale'])
@Index('IDX_payment_allocations_purchase_target', [
  'targetType',
  'targetPurchase',
])
@Check(
  `("targetType" = 'SALE' AND "targetSaleId" IS NOT NULL AND "targetPurchaseId" IS NULL) OR ("targetType" = 'PURCHASE' AND "targetPurchaseId" IS NOT NULL AND "targetSaleId" IS NULL)`,
)
export class PaymentAllocation extends Extender {
  @ManyToOne(() => Payment, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'paymentId' })
  payment: Payment;

  @RelationId((entity: PaymentAllocation) => entity.payment)
  paymentId: number;

  @Column({ type: 'enum', enum: PaymentAllocationTargetType })
  targetType: PaymentAllocationTargetType;

  @ManyToOne(() => Sale, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'targetSaleId' })
  targetSale: Sale | null;

  @RelationId((entity: PaymentAllocation) => entity.targetSale)
  targetSaleId: number | null;

  @ManyToOne(() => Purchase, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'targetPurchaseId' })
  targetPurchase: Purchase | null;

  @RelationId((entity: PaymentAllocation) => entity.targetPurchase)
  targetPurchaseId: number | null;

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  amount: string;
}
