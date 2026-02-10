import { Injectable } from '@nestjs/common';
import {
  InventoryItem,
  InventoryItemStatus,
} from 'src/inventory/entities/inventory-item.entity';
import {
  InventoryActivity,
  InventoryActivityType,
} from 'src/inventory/entities/inventory-activity.entity';
import { PurchaseActivity } from 'src/purchase/entities/purchase-activity.entity';
import { PurchaseItem } from 'src/purchase/entities/purchase-item.entity';
import { UpdateRepairCaseDto } from '../dto/update-repair-case.dto';
import { RepairDetailViewDto } from '../dto/repair-result.dto';
import { Repair, RepairStatus } from '../entities/repair.entity';
import { toRepairDetailView } from '../helper';
import { RepairBaseService } from './repair-base.service';

@Injectable()
export class RepairUpdateCaseService extends RepairBaseService {
  async execute(id: number, dto: UpdateRepairCaseDto): Promise<RepairDetailViewDto> {
    await this.repairsRepository.manager.transaction(async (manager) => {
      const repair = await this.getActiveRepairOrThrow(id, manager);
      const previousStatus = repair.status;

      if (dto.description !== undefined) {
        repair.description = dto.description.trim();
      }

      if (dto.status !== undefined) {
        repair.status = dto.status;
      }

      if (dto.repairedAt !== undefined) {
        repair.repairedAt = this.parseDateOrNow(dto.repairedAt);
      }

      if (dto.notes !== undefined) {
        repair.notes = dto.notes?.trim() || null;
      }

      if (dto.costTotal !== undefined) {
        repair.costTotal = this.toMoney(this.parseNumeric(dto.costTotal));
      }

      if (dto.partsCost !== undefined) {
        repair.partsCost = this.toMoney(this.parseNumeric(dto.partsCost));
      }

      if (dto.laborCost !== undefined) {
        repair.laborCost = this.toMoney(this.parseNumeric(dto.laborCost));
      }

      const technicianId = dto.technicianId ?? dto.assignedTechnicianId;
      if (technicianId !== undefined) {
        if (technicianId === null) {
          repair.technician = null;
        } else {
          await this.getActiveTechnicianOrThrow(Number(technicianId), manager);
          repair.technician = { id: Number(technicianId) } as never;
        }
      }

      await manager.getRepository(Repair).save(repair);

      const item = await this.resolveInventoryItemOrThrow(repair.itemId, undefined, manager);
      const previousItemStatus = item.status;
      if (repair.status === RepairStatus.DONE) {
        item.status = InventoryItemStatus.READY_FOR_SALE;

        if (previousStatus !== RepairStatus.DONE) {
          const purchaseItem = await manager.getRepository(PurchaseItem).findOne({
            where: { item: { id: item.id }, isActive: true },
            relations: ['purchase'],
          });

          if (purchaseItem?.purchase) {
            const activity = manager.getRepository(PurchaseActivity).create({
              purchase: purchaseItem.purchase,
              paidAt: new Date(),
              amount: this.toMoney(this.parseNumeric(repair.costTotal)),
              notes: `Repaired: total cost ${this.toMoney(this.parseNumeric(repair.costTotal))}`,
            });
            await manager.getRepository(PurchaseActivity).save(activity);
          }
        }
      } else if (item.status !== InventoryItemStatus.SOLD) {
        item.status = InventoryItemStatus.IN_REPAIR;
      }
      await manager.getRepository(InventoryItem).save(item);

      if (previousItemStatus !== item.status) {
        const type =
          previousItemStatus !== InventoryItemStatus.IN_REPAIR &&
          item.status === InventoryItemStatus.IN_REPAIR
            ? InventoryActivityType.MOVED_TO_REPAIR
            : previousItemStatus === InventoryItemStatus.IN_REPAIR &&
                item.status === InventoryItemStatus.READY_FOR_SALE
              ? InventoryActivityType.MARKED_DONE
              : InventoryActivityType.STATUS_CHANGED;

        await manager.getRepository(InventoryActivity).save(
          manager.getRepository(InventoryActivity).create({
            item,
            type,
            fromStatus: previousItemStatus,
            toStatus: item.status,
            notes:
              type === InventoryActivityType.MARKED_DONE
                ? `Repair completed: ${this.toMoney(this.parseNumeric(repair.costTotal))}`
                : type === InventoryActivityType.MOVED_TO_REPAIR
                  ? 'Repair case moved to in-repair state'
                  : `Inventory status changed from ${previousItemStatus} to ${item.status}`,
          }),
        );
      }
    });

    const repair = await this.getActiveRepairWithRelationsOrThrow(id);
    return toRepairDetailView(repair);
  }
}
