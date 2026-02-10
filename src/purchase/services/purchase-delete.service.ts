import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Customer } from 'src/customer/entities/customer.entity';
import { InventoryItem } from 'src/inventory/entities/inventory-item.entity';
import { PurchaseActivity } from '../entities/purchase-activity.entity';
import { PurchaseItem } from '../entities/purchase-item.entity';
import { Purchase } from '../entities/purchase.entity';
import { RepairEntry } from 'src/repair/entities/repair-entry.entity';
import { Repair } from 'src/repair/entities/repair.entity';
import { SaleActivity } from 'src/sale/entities/sale-activity.entity';
import { SaleItem } from 'src/sale/entities/sale-item.entity';
import { Sale } from 'src/sale/entities/sale.entity';
import { Repository } from 'typeorm';
import { PurchaseBaseService } from './purchase-base.service';

@Injectable()
export class PurchaseDeleteService extends PurchaseBaseService {
  constructor(
    @InjectRepository(Purchase)
    purchasesRepository: Repository<Purchase>,
    @InjectRepository(PurchaseItem)
    purchaseItemsRepository: Repository<PurchaseItem>,
    @InjectRepository(InventoryItem)
    inventoryItemsRepository: Repository<InventoryItem>,
    @InjectRepository(Customer)
    customersRepository: Repository<Customer>,
    @InjectRepository(PurchaseActivity)
    purchaseActivitiesRepository: Repository<PurchaseActivity>,
  ) {
    super(
      purchasesRepository,
      purchaseItemsRepository,
      inventoryItemsRepository,
      customersRepository,
      purchaseActivitiesRepository,
    );
  }

  async execute(id: number): Promise<{ success: true }> {
    await this.purchasesRepository.manager.transaction(async (manager) => {
      const purchase = await this.getActivePurchaseOrThrow(id, manager);
      const now = new Date();

      const purchaseItems = await manager.getRepository(PurchaseItem).find({
        where: { purchase: { id }, isActive: true },
        relations: { item: true },
      });

      const itemIds = purchaseItems.map((entry) => entry.itemId);
      const relatedSaleIds =
        itemIds.length > 0
          ? Array.from(
              new Set(
                (
                  await manager
                    .getRepository(InventoryItem)
                    .createQueryBuilder('item')
                    .select('item.saleId', 'saleId')
                    .where('item.id IN (:...itemIds)', { itemIds })
                    .andWhere('item.saleId IS NOT NULL')
                    .getRawMany<{ saleId: string }>()
                ).map((row) => Number(row.saleId)),
              ),
            )
          : [];

      if (itemIds.length > 0) {
        const repairs = await manager
          .getRepository(Repair)
          .createQueryBuilder('repair')
          .where('repair.itemId IN (:...itemIds)', { itemIds })
          .andWhere('repair.isActive = :isActive', { isActive: true })
          .getMany();

        const repairIds = repairs.map((repair) => repair.id);

        if (repairIds.length > 0) {
          await manager
            .getRepository(RepairEntry)
            .createQueryBuilder()
            .update(RepairEntry)
            .set({ isActive: false, deletedAt: now })
            .where('repairId IN (:...repairIds)', { repairIds })
            .andWhere('isActive = :isActive', { isActive: true })
            .execute();

          await manager
            .getRepository(Repair)
            .createQueryBuilder()
            .update(Repair)
            .set({ isActive: false, deletedAt: now })
            .where('id IN (:...repairIds)', { repairIds })
            .andWhere('isActive = :isActive', { isActive: true })
            .execute();
        }

        await manager
          .getRepository(InventoryItem)
          .createQueryBuilder()
          .update(InventoryItem)
          .set({ isActive: false, deletedAt: now })
          .where('id IN (:...itemIds)', { itemIds })
          .andWhere('isActive = :isActive', { isActive: true })
          .execute();
      }

      if (relatedSaleIds.length > 0) {
        await manager
          .getRepository(SaleActivity)
          .createQueryBuilder()
          .update(SaleActivity)
          .set({ isActive: false, deletedAt: now })
          .where('saleId IN (:...saleIds)', { saleIds: relatedSaleIds })
          .andWhere('isActive = :isActive', { isActive: true })
          .execute();

        await manager
          .getRepository(SaleItem)
          .createQueryBuilder()
          .update(SaleItem)
          .set({ isActive: false, deletedAt: now })
          .where('saleId IN (:...saleIds)', { saleIds: relatedSaleIds })
          .andWhere('isActive = :isActive', { isActive: true })
          .execute();

        await manager
          .getRepository(Sale)
          .createQueryBuilder()
          .update(Sale)
          .set({ isActive: false, deletedAt: now })
          .where('id IN (:...saleIds)', { saleIds: relatedSaleIds })
          .andWhere('isActive = :isActive', { isActive: true })
          .execute();
      }

      await manager
        .getRepository(PurchaseActivity)
        .createQueryBuilder()
        .update(PurchaseActivity)
        .set({ isActive: false, deletedAt: now })
        .where('purchaseId = :purchaseId', { purchaseId: id })
        .andWhere('isActive = :isActive', { isActive: true })
        .execute();

      await manager
        .getRepository(PurchaseItem)
        .createQueryBuilder()
        .update(PurchaseItem)
        .set({ isActive: false, deletedAt: now })
        .where('purchaseId = :purchaseId', { purchaseId: id })
        .andWhere('isActive = :isActive', { isActive: true })
        .execute();

      purchase.isActive = false;
      purchase.deletedAt = now;
      await manager.getRepository(Purchase).save(purchase);
    });

    return { success: true };
  }
}
