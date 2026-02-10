import {
  InventoryItemCondition,
  InventoryItemStatus,
} from '../entities/inventory-item.entity';

export class InventoryItemViewDto {
  id: number;
  imei: string;
  brand: string;
  model: string;
  storage?: string | null;
  color?: string | null;
  condition: InventoryItemCondition;
  knownIssues?: string | null;
  expectedSalePrice?: string | null;
  status: InventoryItemStatus;
  purchaseId?: number | null;
  saleId?: number | null;
}
