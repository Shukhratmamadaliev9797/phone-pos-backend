import {
  SaleDetailViewDto,
  SalePaymentActivityDto,
  SaleItemViewDto,
  SaleListViewDto,
  SaleViewDto,
} from './dto/sale-result.dto';
import { SaleActivity } from './entities/sale-activity.entity';
import { SaleItem } from './entities/sale-item.entity';
import { Sale } from './entities/sale.entity';

export function toSaleView(sale: Sale): SaleViewDto {
  return {
    id: sale.id,
    soldAt: sale.soldAt,
    customerId: sale.customerId,
    sellerWorkerId: sale.sellerWorkerId,
    paymentMethod: sale.paymentMethod,
    paymentType: sale.paymentType,
    totalPrice: sale.totalPrice,
    paidNow: sale.paidNow,
    remaining: sale.remaining,
    installmentMonths: sale.installmentMonths,
    firstPaymentNow: sale.firstPaymentNow,
    monthlyInstallmentAmount: sale.monthlyInstallmentAmount,
    profit: sale.profit,
    notes: sale.notes,
    customer: sale.customer
      ? {
          id: sale.customer.id,
          fullName: sale.customer.fullName,
          phoneNumber: sale.customer.phoneNumber,
          address: sale.customer.address,
        }
      : null,
  };
}

export function toSaleItemView(item: SaleItem): SaleItemViewDto {
  return {
    id: item.id,
    itemId: item.itemId,
    salePrice: item.salePrice,
    notes: item.notes,
    item: {
      imei: item.item?.imei,
      brand: item.item?.brand,
      model: item.item?.model,
      status: item.item?.status,
      condition: item.item?.condition,
      storage: item.item?.storage,
      color: item.item?.color,
      serialNumber: item.item?.serialNumber,
      knownIssues: item.item?.knownIssues,
    },
  };
}

export function toSaleListView(
  sale: Sale,
  itemsCount: number,
  phoneLabel: string | null,
): SaleListViewDto {
  return {
    ...toSaleView(sale),
    itemsCount,
    phoneLabel,
  };
}

export function toSaleDetailView(sale: Sale): SaleDetailViewDto {
  return {
    ...toSaleView(sale),
    items: (sale.items ?? []).map(toSaleItemView),
    activities: (sale.activities ?? []).map(toSaleActivityView),
  };
}

export function toSaleActivityView(
  activity: SaleActivity,
): SalePaymentActivityDto {
  return {
    id: activity.id,
    paidAt: activity.paidAt,
    amount: activity.amount,
    notes: activity.notes,
  };
}
