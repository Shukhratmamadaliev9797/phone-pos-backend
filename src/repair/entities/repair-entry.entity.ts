import { Column, Entity, JoinColumn, ManyToOne, RelationId } from 'typeorm';
import { Extender } from 'src/common/entities/common.entites';
import { Repair } from './repair.entity';

@Entity({ name: 'repair_entries' })
export class RepairEntry extends Extender {
  @ManyToOne(() => Repair, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'repairId' })
  repair: Repair;

  @RelationId((entity: RepairEntry) => entity.repair)
  repairId: number;

  @Column({ type: 'timestamptz' })
  entryAt: Date;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  costTotal: string;

  @Column({ type: 'numeric', precision: 12, scale: 2, nullable: true })
  partsCost: string | null;

  @Column({ type: 'numeric', precision: 12, scale: 2, nullable: true })
  laborCost: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;
}
