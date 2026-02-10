import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  RelationId,
} from 'typeorm';
import { Extender } from 'src/common/entities/common.entites';
import { InventoryItem } from 'src/inventory/entities/inventory-item.entity';
import { User } from 'src/user/user/entities/user.entity';
import { RepairEntry } from './repair-entry.entity';

export enum RepairStatus {
  PENDING = 'PENDING',
  DONE = 'DONE',
}

@Entity({ name: 'repairs' })
export class Repair extends Extender {
  @ManyToOne(() => InventoryItem, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'itemId' })
  item: InventoryItem;

  @RelationId((entity: Repair) => entity.item)
  itemId: number;

  @Column({ type: 'timestamptz' })
  repairedAt: Date;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'enum', enum: RepairStatus, default: RepairStatus.PENDING })
  status: RepairStatus;

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  costTotal: string;

  @Column({ type: 'numeric', precision: 12, scale: 2, nullable: true })
  partsCost: string | null;

  @Column({ type: 'numeric', precision: 12, scale: 2, nullable: true })
  laborCost: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'technicianId' })
  technician: User | null;

  @RelationId((entity: Repair) => entity.technician)
  technicianId: number | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @OneToMany(() => RepairEntry, (entry) => entry.repair)
  entries?: RepairEntry[];
}
