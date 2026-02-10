import { PaymentDirection, PaymentMethod } from '../entities/payment.entity';

export class PaymentViewDto {
  id: number;
  paidAt: Date;
  customerId: number;
  direction: PaymentDirection;
  amount: string;
  method: PaymentMethod;
  notes?: string | null;
}
