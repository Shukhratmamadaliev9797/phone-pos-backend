import { RepairStatus } from '../entities/repair.entity';

export class RepairViewDto {
  id: number;
  itemId: number;
  repairedAt: Date;
  description: string;
  status: RepairStatus;
  costTotal: string;
  partsCost?: string | null;
  laborCost?: string | null;
  technicianId?: number | null;
}
