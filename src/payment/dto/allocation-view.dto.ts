import { PaymentAllocationTargetType } from '../entities/payment-allocation.entity';

export class AllocationViewDto {
  id: number;
  paymentId: number;
  targetType: PaymentAllocationTargetType;
  targetSaleId?: number | null;
  targetPurchaseId?: number | null;
  amount: string;
}
