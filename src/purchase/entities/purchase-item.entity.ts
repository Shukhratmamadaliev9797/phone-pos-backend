import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  RelationId,
} from 'typeorm';
import { Extender } from 'src/common/entities/common.entites';
import { InventoryItem } from 'src/inventory/entities/inventory-item.entity';
import { Purchase } from './purchase.entity';

@Entity({ name: 'purchase_items' })
@Index(['item'], { unique: true })
export class PurchaseItem extends Extender {
  @ManyToOne(() => Purchase, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'purchaseId' })
  purchase: Purchase;

  @RelationId((entity: PurchaseItem) => entity.purchase)
  purchaseId: number;

  @ManyToOne(() => InventoryItem, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'itemId' })
  item: InventoryItem;

  @RelationId((entity: PurchaseItem) => entity.item)
  itemId: number;

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  purchasePrice: string;

  @Column({ type: 'text', nullable: true })
  notes: string | null;
}
