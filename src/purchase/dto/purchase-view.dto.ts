import {
  PurchasePaymentMethod,
  PurchasePaymentType,
} from '../entities/purchase.entity';

export class PurchaseViewDto {
  id: number;
  purchasedAt: Date;
  customerId?: number | null;
  paymentMethod: PurchasePaymentMethod;
  paymentType: PurchasePaymentType;
  totalPrice: string;
  paidNow: string;
  remaining: string;
  notes?: string | null;
}
