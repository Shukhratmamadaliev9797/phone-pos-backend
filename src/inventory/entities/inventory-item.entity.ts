import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  RelationId,
} from 'typeorm';
import { Extender } from 'src/common/entities/common.entites';
import { Purchase } from 'src/purchase/entities/purchase.entity';
import { Sale } from 'src/sale/entities/sale.entity';
import { InventoryActivity } from './inventory-activity.entity';

export enum InventoryItemCondition {
  GOOD = 'GOOD',
  USED = 'USED',
  BROKEN = 'BROKEN',
}

export enum InventoryItemStatus {
  IN_STOCK = 'IN_STOCK',
  IN_REPAIR = 'IN_REPAIR',
  READY_FOR_SALE = 'READY_FOR_SALE',
  SOLD = 'SOLD',
  RETURNED = 'RETURNED',
}

@Entity({ name: 'inventory_items' })
export class InventoryItem extends Extender {
  @Index({ unique: true })
  @Column({ type: 'varchar', length: 40 })
  imei: string;

  @Index()
  @Column({ type: 'varchar', length: 50, nullable: true })
  serialNumber: string | null;

  @Column({ type: 'varchar', length: 80 })
  brand: string;

  @Column({ type: 'varchar', length: 80 })
  model: string;

  @Column({ type: 'varchar', length: 40, nullable: true })
  storage: string | null;

  @Column({ type: 'varchar', length: 40, nullable: true })
  color: string | null;

  @Column({
    type: 'enum',
    enum: InventoryItemCondition,
    default: InventoryItemCondition.GOOD,
  })
  condition: InventoryItemCondition;

  @Column({ type: 'text', nullable: true })
  knownIssues: string | null;

  @Column({ type: 'numeric', precision: 12, scale: 2, nullable: true })
  expectedSalePrice: string | null;

  @Column({
    type: 'enum',
    enum: InventoryItemStatus,
    default: InventoryItemStatus.IN_STOCK,
  })
  status: InventoryItemStatus;

  @ManyToOne(() => Purchase, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'purchaseId' })
  purchase: Purchase | null;

  @RelationId((entity: InventoryItem) => entity.purchase)
  purchaseId: number | null;

  @ManyToOne(() => Sale, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'saleId' })
  sale: Sale | null;

  @RelationId((entity: InventoryItem) => entity.sale)
  saleId: number | null;

  @OneToMany(() => InventoryActivity, (activity) => activity.item)
  activities: InventoryActivity[];
}
