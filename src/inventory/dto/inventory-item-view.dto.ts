import {
  InventoryItemCondition,
  InventoryItemStatus,
} from '../entities/inventory-item.entity';
import {
  InventoryActivityType,
  InventoryItemStatusValue,
} from '../entities/inventory-activity.entity';

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

export class InventoryActivityViewDto {
  id: number;
  type: InventoryActivityType;
  fromStatus?: InventoryItemStatusValue | null;
  toStatus: InventoryItemStatusValue;
  notes?: string | null;
  happenedAt: Date;
}

export class InventoryItemDetailViewDto extends InventoryItemViewDto {
  repairCost?: number;
  activities: InventoryActivityViewDto[];
}
