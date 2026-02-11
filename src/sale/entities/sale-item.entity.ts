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
import { Sale } from './sale.entity';

@Entity({ name: 'sale_items' })
@Index(['item'], { unique: true, where: '"isActive" = true' })
export class SaleItem extends Extender {
  @ManyToOne(() => Sale, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'saleId' })
  sale: Sale;

  @RelationId((entity: SaleItem) => entity.sale)
  saleId: number;

  @ManyToOne(() => InventoryItem, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'itemId' })
  item: InventoryItem;

  @RelationId((entity: SaleItem) => entity.item)
  itemId: number;

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  salePrice: string;

  @Column({ type: 'text', nullable: true })
  notes: string | null;
}
