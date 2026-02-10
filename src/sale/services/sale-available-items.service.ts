import { Injectable } from '@nestjs/common';
import {
  SaleAvailableItemDto,
  SaleAvailableItemsQueryDto,
} from '../dto/sale-result.dto';
import { InventoryItemStatus } from 'src/inventory/entities/inventory-item.entity';
import { PurchaseItem } from 'src/purchase/entities/purchase-item.entity';
import { SaleBaseService } from './sale-base.service';

@Injectable()
export class SaleAvailableItemsService extends SaleBaseService {
  async execute(query: SaleAvailableItemsQueryDto): Promise<SaleAvailableItemDto[]> {
    const builder = this.inventoryItemsRepository
      .createQueryBuilder('inventoryItem')
      .leftJoin(
        PurchaseItem,
        'purchaseItem',
        'purchaseItem.itemId = inventoryItem.id AND purchaseItem.isActive = :purchaseItemIsActive',
        {
          purchaseItemIsActive: true,
        },
      )
      .leftJoin(
        'inventoryItem.purchase',
        'purchase',
        'purchase.isActive = :purchaseIsActive',
        {
          purchaseIsActive: true,
        },
      )
      .select('inventoryItem.id', 'id')
      .addSelect('COALESCE(purchase.id, 0)', 'purchaseId')
      .addSelect('inventoryItem.imei', 'imei')
      .addSelect('inventoryItem.brand', 'brand')
      .addSelect('inventoryItem.model', 'model')
      .addSelect('inventoryItem.condition', 'condition')
      .addSelect('inventoryItem.status', 'status')
      .addSelect('COALESCE(purchaseItem.purchasePrice, 0)', 'purchasePrice')
      .where('inventoryItem.isActive = :inventoryIsActive', {
        inventoryIsActive: true,
      })
      .andWhere('inventoryItem.saleId IS NULL')
      .andWhere('inventoryItem.status IN (:...allowedStatuses)', {
        allowedStatuses: [
          InventoryItemStatus.IN_STOCK,
          InventoryItemStatus.READY_FOR_SALE,
        ],
      })
      .orderBy('inventoryItem.id', 'DESC');

    const keyword = query.q?.trim();
    if (keyword) {
      builder.andWhere(
        `(inventoryItem.imei ILIKE :q OR inventoryItem.brand ILIKE :q OR inventoryItem.model ILIKE :q)`,
        { q: `%${keyword}%` },
      );
    }

    const rows = await builder.getRawMany<{
      id: string;
      purchaseId: string;
      imei: string;
      brand: string;
      model: string;
      condition: SaleAvailableItemDto['condition'];
      status: SaleAvailableItemDto['status'];
      purchasePrice: string;
    }>();

    return rows.map((row) => ({
      id: Number(row.id),
      purchaseId: Number(row.purchaseId),
      imei: row.imei,
      brand: row.brand,
      model: row.model,
      condition: row.condition,
      status: row.status,
      purchasePrice: row.purchasePrice,
    }));
  }
}
