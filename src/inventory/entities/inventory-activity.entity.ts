import { Column, Entity, JoinColumn, ManyToOne, RelationId } from 'typeorm';
import { Extender } from 'src/common/entities/common.entites';
import { InventoryItem } from './inventory-item.entity';

export enum InventoryActivityType {
  CREATED = 'CREATED',
  PURCHASED = 'PURCHASED',
  SOLD = 'SOLD',
  STATUS_CHANGED = 'STATUS_CHANGED',
  MOVED_TO_REPAIR = 'MOVED_TO_REPAIR',
  MARKED_DONE = 'MARKED_DONE',
}

export const INVENTORY_ITEM_STATUS_VALUES = [
  'IN_STOCK',
  'IN_REPAIR',
  'READY_FOR_SALE',
  'SOLD',
  'RETURNED',
] as const;
export type InventoryItemStatusValue =
  (typeof INVENTORY_ITEM_STATUS_VALUES)[number];

@Entity({ name: 'inventory_activities' })
export class InventoryActivity extends Extender {
  @ManyToOne(() => InventoryItem, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'itemId' })
  item: InventoryItem;

  @RelationId((entity: InventoryActivity) => entity.item)
  itemId: number;

  @Column({
    type: 'enum',
    enum: InventoryActivityType,
    default: InventoryActivityType.STATUS_CHANGED,
  })
  type: InventoryActivityType;

  @Column({ type: 'enum', enum: INVENTORY_ITEM_STATUS_VALUES, nullable: true })
  fromStatus: InventoryItemStatusValue | null;

  @Column({ type: 'enum', enum: INVENTORY_ITEM_STATUS_VALUES })
  toStatus: InventoryItemStatusValue;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ type: 'timestamptz', default: () => 'now()' })
  happenedAt: Date;
}
