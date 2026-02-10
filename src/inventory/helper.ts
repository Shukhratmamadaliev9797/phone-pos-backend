import {
  InventoryActivityViewDto,
  InventoryItemDetailViewDto,
  InventoryItemViewDto,
} from './dto/inventory-item-view.dto';
import { InventoryActivity } from './entities/inventory-activity.entity';
import { InventoryItem } from './entities/inventory-item.entity';

export function toInventoryItemView(item: InventoryItem): InventoryItemViewDto {
  return {
    id: item.id,
    imei: item.imei,
    brand: item.brand,
    model: item.model,
    storage: item.storage,
    color: item.color,
    condition: item.condition,
    knownIssues: item.knownIssues,
    expectedSalePrice: item.expectedSalePrice,
    status: item.status,
    purchaseId: item.purchaseId,
    saleId: item.saleId,
  };
}

export function toInventoryActivityView(
  activity: InventoryActivity,
): InventoryActivityViewDto {
  return {
    id: activity.id,
    type: activity.type,
    fromStatus: activity.fromStatus,
    toStatus: activity.toStatus,
    notes: activity.notes,
    happenedAt: activity.happenedAt,
  };
}

export function toInventoryItemDetailView(
  item: InventoryItem,
): InventoryItemDetailViewDto {
  return {
    ...toInventoryItemView(item),
    activities: (item.activities ?? []).map(toInventoryActivityView),
  };
}
