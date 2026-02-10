import { InventoryItemViewDto } from './dto/inventory-item-view.dto';
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
