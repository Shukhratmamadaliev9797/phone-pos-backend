import { Column, Entity, JoinColumn, ManyToOne, RelationId } from 'typeorm';
import { Extender } from 'src/common/entities/common.entites';
import { Purchase } from './purchase.entity';

@Entity({ name: 'purchase_activities' })
export class PurchaseActivity extends Extender {
  @ManyToOne(() => Purchase, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'purchaseId' })
  purchase: Purchase;

  @RelationId((entity: PurchaseActivity) => entity.purchase)
  purchaseId: number;

  @Column({ type: 'timestamptz' })
  paidAt: Date;

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  amount: string;

  @Column({ type: 'text', nullable: true })
  notes: string | null;
}
