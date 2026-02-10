import {
  PurchaseDetailViewDto,
  PurchasePaymentActivityDto,
  PurchaseItemViewDto,
  PurchaseListViewDto,
  PurchaseViewDto,
} from './dto/purchase-result.dto';
import { PurchaseActivity } from './entities/purchase-activity.entity';
import { PurchaseItem } from './entities/purchase-item.entity';
import { Purchase } from './entities/purchase.entity';

export function toPurchaseView(purchase: Purchase): PurchaseViewDto {
  return {
    id: purchase.id,
    purchasedAt: purchase.purchasedAt,
    customerId: purchase.customerId,
    paymentMethod: purchase.paymentMethod,
    paymentType: purchase.paymentType,
    totalPrice: purchase.totalPrice,
    paidNow: purchase.paidNow,
    remaining: purchase.remaining,
    notes: purchase.notes,
    customer: purchase.customer
      ? {
          id: purchase.customer.id,
          fullName: purchase.customer.fullName,
          phoneNumber: purchase.customer.phoneNumber,
          address: purchase.customer.address,
        }
      : null,
  };
}

export function toPurchaseItemView(item: PurchaseItem): PurchaseItemViewDto {
  return {
    id: item.id,
    itemId: item.itemId,
    purchasePrice: item.purchasePrice,
    notes: item.notes,
    item: {
      imei: item.item?.imei,
      serialNumber: item.item?.serialNumber,
      brand: item.item?.brand,
      model: item.item?.model,
      storage: item.item?.storage,
      color: item.item?.color,
      status: item.item?.status,
      condition: item.item?.condition,
      knownIssues: item.item?.knownIssues,
    },
  };
}

export function toPurchaseListView(
  purchase: Purchase,
  itemsCount: number,
  phoneLabel: string | null,
  phoneStatus: PurchaseListViewDto['phoneStatus'],
): PurchaseListViewDto {
  return {
    ...toPurchaseView(purchase),
    itemsCount,
    phoneLabel,
    phoneStatus,
  };
}

export function toPurchaseDetailView(purchase: Purchase): PurchaseDetailViewDto {
  return {
    ...toPurchaseView(purchase),
    items: (purchase.items ?? []).map(toPurchaseItemView),
    activities: (purchase.activities ?? []).map(toPurchaseActivityView),
  };
}

export function toPurchaseActivityView(
  activity: PurchaseActivity,
): PurchasePaymentActivityDto {
  return {
    id: activity.id,
    paidAt: activity.paidAt,
    amount: activity.amount,
    notes: activity.notes,
  };
}
