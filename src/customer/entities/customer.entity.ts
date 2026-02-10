import { Column, Entity, Index } from 'typeorm';
import { Extender } from 'src/common/entities/common.entites';

@Entity({ name: 'customers' })
export class Customer extends Extender {
  @Column({ type: 'varchar', length: 120 })
  fullName: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 30 })
  phoneNumber: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  address: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  passportId: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;
}
