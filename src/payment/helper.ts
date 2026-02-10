import { AllocationViewDto } from './dto/allocation-view.dto';
import { PaymentViewDto } from './dto/payment-view.dto';
import { PaymentAllocation } from './entities/payment-allocation.entity';
import { Payment } from './entities/payment.entity';

export function toPaymentView(payment: Payment): PaymentViewDto {
  return {
    id: payment.id,
    paidAt: payment.paidAt,
    customerId: payment.customerId,
    direction: payment.direction,
    amount: payment.amount,
    method: payment.method,
    notes: payment.notes,
  };
}

export function toAllocationView(allocation: PaymentAllocation): AllocationViewDto {
  return {
    id: allocation.id,
    paymentId: allocation.paymentId,
    targetType: allocation.targetType,
    targetSaleId: allocation.targetSaleId,
    targetPurchaseId: allocation.targetPurchaseId,
    amount: allocation.amount,
  };
}
