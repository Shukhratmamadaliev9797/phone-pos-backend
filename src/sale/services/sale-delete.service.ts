import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Customer } from 'src/customer/entities/customer.entity';
import {
  InventoryItem,
  InventoryItemStatus,
} from 'src/inventory/entities/inventory-item.entity';
import { RepairEntry } from 'src/repair/entities/repair-entry.entity';
import { Repair } from 'src/repair/entities/repair.entity';
import { Repository } from 'typeorm';
import { SaleActivity } from '../entities/sale-activity.entity';
import { SaleItem } from '../entities/sale-item.entity';
import { Sale } from '../entities/sale.entity';
import { SaleBaseService } from './sale-base.service';

@Injectable()
export class SaleDeleteService extends SaleBaseService {
  constructor(
    @InjectRepository(Sale)
    salesRepository: Repository<Sale>,
    @InjectRepository(SaleItem)
    saleItemsRepository: Repository<SaleItem>,
    @InjectRepository(InventoryItem)
    inventoryItemsRepository: Repository<InventoryItem>,
    @InjectRepository(Customer)
    customersRepository: Repository<Customer>,
    @InjectRepository(SaleActivity)
    saleActivitiesRepository: Repository<SaleActivity>,
  ) {
    super(
      salesRepository,
      saleItemsRepository,
      inventoryItemsRepository,
      customersRepository,
      saleActivitiesRepository,
    );
  }

  async execute(id: number): Promise<{ success: true }> {
    await this.salesRepository.manager.transaction(async (manager) => {
      const sale = await this.getActiveSaleOrThrow(id, manager);
      const now = new Date();

      const saleItems = await manager.getRepository(SaleItem).find({
        where: { sale: { id }, isActive: true },
        relations: { item: true },
      });

      const itemIds = saleItems.map((entry) => entry.itemId);

      await manager
        .getRepository(SaleActivity)
        .createQueryBuilder()
        .update(SaleActivity)
        .set({ isActive: false, deletedAt: now })
        .where('saleId = :saleId', { saleId: id })
        .andWhere('isActive = :isActive', { isActive: true })
        .execute();

      await manager
        .getRepository(SaleItem)
        .createQueryBuilder()
        .update(SaleItem)
        .set({ isActive: false, deletedAt: now })
        .where('saleId = :saleId', { saleId: id })
        .andWhere('isActive = :isActive', { isActive: true })
        .execute();

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

        const inventoryItems = await manager.getRepository(InventoryItem).find({
          where: itemIds.map((itemId) => ({ id: itemId, isActive: true })),
        });

        for (const item of inventoryItems) {
          item.sale = null;
          if (item.status === InventoryItemStatus.SOLD) {
            item.status = InventoryItemStatus.READY_FOR_SALE;
          }
          await manager.getRepository(InventoryItem).save(item);
        }
      }

      sale.isActive = false;
      sale.deletedAt = now;
      await manager.getRepository(Sale).save(sale);
    });

    return { success: true };
  }
}
