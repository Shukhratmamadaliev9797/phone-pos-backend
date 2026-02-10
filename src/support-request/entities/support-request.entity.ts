import { Extender } from 'src/common/entities/common.entites';
import { User, UserRole } from 'src/user/user/entities/user.entity';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';

@Entity({ name: 'support_requests' })
export class SupportRequest extends Extender {
  @Column({ type: 'int', nullable: true })
  senderUserId: number | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'senderUserId' })
  senderUser: User | null;

  @Column({ type: 'varchar', length: 120 })
  senderFullName: string;

  @Column({ type: 'enum', enum: UserRole })
  senderRole: UserRole;

  @Column({ type: 'text' })
  message: string;

  @Column({ type: 'boolean', default: false })
  isRead: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  readAt: Date | null;

  @Column({ type: 'int', nullable: true })
  readByAdminId: number | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'readByAdminId' })
  readByAdmin: User | null;
}
