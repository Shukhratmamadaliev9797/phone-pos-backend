import { Injectable } from '@nestjs/common';
import { InventoryItemStatus } from 'src/inventory/entities/inventory-item.entity';
import { PurchaseListQueryDto, PurchaseListResponseDto } from '../dto/purchase-result.dto';
import { PurchaseItem } from '../entities/purchase-item.entity';
import { Purchase } from '../entities/purchase.entity';
import { toPurchaseListView } from '../helper';
import { PurchaseBaseService } from './purchase-base.service';

@Injectable()
export class PurchaseFindAllService extends PurchaseBaseService {
  async execute(query: PurchaseListQueryDto): Promise<PurchaseListResponseDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    const builder = this.purchasesRepository
      .createQueryBuilder('purchase')
      .leftJoinAndSelect(
        'purchase.customer',
        'customer',
        'customer.isActive = :customerIsActive',
        { customerIsActive: true },
      )
      .where('purchase.isActive = :isActive', { isActive: true })
      .orderBy('purchase.id', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (query.customerId) {
      builder.andWhere('purchase.customerId = :customerId', {
        customerId: query.customerId,
      });
    }

    if (query.paymentType) {
      builder.andWhere('purchase.paymentType = :paymentType', {
        paymentType: query.paymentType,
      });
    }

    if (query.from) {
      builder.andWhere('purchase.purchasedAt >= :from', {
        from: this.parseDateOrNow(query.from),
      });
    }

    if (query.to) {
      builder.andWhere('purchase.purchasedAt <= :to', {
        to: this.parseDateOrNow(query.to),
      });
    }

    const [data, total] = await builder.getManyAndCount();

    const purchaseIds = data.map((purchase) => purchase.id);
    const countByPurchaseId = new Map<number, number>();
    const phoneLabelByPurchaseId = new Map<number, string | null>();
    const phoneStatusByPurchaseId = new Map<number, InventoryItemStatus | null>();

    if (purchaseIds.length > 0) {
      const itemCounts = await this.purchaseItemsRepository
        .createQueryBuilder('purchaseItem')
        .select('purchaseItem.purchaseId', 'purchaseId')
        .addSelect('COUNT(purchaseItem.id)', 'itemsCount')
        .where('purchaseItem.purchaseId IN (:...purchaseIds)', {
          purchaseIds,
        })
        .andWhere('purchaseItem.isActive = :isActive', { isActive: true })
        .groupBy('purchaseItem.purchaseId')
        .getRawMany<{ purchaseId: string; itemsCount: string }>();

      for (const row of itemCounts) {
        countByPurchaseId.set(Number(row.purchaseId), Number(row.itemsCount));
      }

      const itemPhones = await this.purchaseItemsRepository
        .createQueryBuilder('purchaseItem')
        .leftJoin('purchaseItem.item', 'inventoryItem')
        .select('purchaseItem.purchaseId', 'purchaseId')
        .addSelect('purchaseItem.id', 'purchaseItemId')
        .addSelect('inventoryItem.brand', 'brand')
        .addSelect('inventoryItem.model', 'model')
        .addSelect('inventoryItem.status', 'status')
        .where('purchaseItem.purchaseId IN (:...purchaseIds)', { purchaseIds })
        .andWhere('purchaseItem.isActive = :isActive', { isActive: true })
        .andWhere('inventoryItem.isActive = :inventoryActive', { inventoryActive: true })
        .orderBy('purchaseItem.purchaseId', 'ASC')
        .addOrderBy('purchaseItem.id', 'ASC')
        .getRawMany<{
          purchaseId: string;
          brand: string | null;
          model: string | null;
          status: InventoryItemStatus | null;
        }>();

      for (const row of itemPhones) {
        const purchaseId = Number(row.purchaseId);
        if (phoneLabelByPurchaseId.has(purchaseId)) {
          continue;
        }
        const brand = row.brand ?? '';
        const model = row.model ?? '';
        const label = `${brand} ${model}`.trim();
        phoneLabelByPurchaseId.set(purchaseId, label || null);
        phoneStatusByPurchaseId.set(purchaseId, row.status ?? null);
      }
    }

    return {
      data: data.map((purchase: Purchase) =>
        toPurchaseListView(
          purchase,
          countByPurchaseId.get(purchase.id) ?? 0,
          phoneLabelByPurchaseId.get(purchase.id) ?? null,
          phoneStatusByPurchaseId.get(purchase.id) ?? null,
        ),
      ),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }
}
