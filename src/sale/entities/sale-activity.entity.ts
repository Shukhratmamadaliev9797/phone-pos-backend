import { Column, Entity, JoinColumn, ManyToOne, RelationId } from 'typeorm';
import { Extender } from 'src/common/entities/common.entites';
import { Sale } from './sale.entity';

@Entity({ name: 'sale_activities' })
export class SaleActivity extends Extender {
  @ManyToOne(() => Sale, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'saleId' })
  sale: Sale;

  @RelationId((entity: SaleActivity) => entity.sale)
  saleId: number;

  @Column({ type: 'timestamptz' })
  paidAt: Date;

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  amount: string;

  @Column({ type: 'text', nullable: true })
  notes: string | null;
}
