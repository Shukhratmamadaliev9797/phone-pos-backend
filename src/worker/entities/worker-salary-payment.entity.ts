import { Column, Entity, JoinColumn, ManyToOne, RelationId } from 'typeorm';
import { Extender } from 'src/common/entities/common.entites';
import { Worker } from './worker.entity';

@Entity({ name: 'worker_salary_payments' })
export class WorkerSalaryPayment extends Extender {
  @ManyToOne(() => Worker, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'workerId' })
  worker: Worker;

  @RelationId((entity: WorkerSalaryPayment) => entity.worker)
  workerId: number;

  @Column({ type: 'varchar', length: 7 })
  month: string;

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  amountPaid: string;

  @Column({ type: 'timestamptz', default: () => 'now()' })
  paidAt: Date;

  @Column({ type: 'text', nullable: true })
  notes: string | null;
}
