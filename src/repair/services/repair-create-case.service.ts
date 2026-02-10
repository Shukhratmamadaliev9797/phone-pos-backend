import { Injectable } from '@nestjs/common';
import { InventoryItemStatus } from 'src/inventory/entities/inventory-item.entity';
import {
  InventoryActivity,
  InventoryActivityType,
} from 'src/inventory/entities/inventory-activity.entity';
import { CreateRepairCaseDto } from '../dto/create-repair-case.dto';
import { RepairDetailViewDto } from '../dto/repair-result.dto';
import { RepairEntry } from '../entities/repair-entry.entity';
import { Repair, RepairStatus } from '../entities/repair.entity';
import { toRepairDetailView } from '../helper';
import { RepairBaseService } from './repair-base.service';
import { InventoryItem } from 'src/inventory/entities/inventory-item.entity';

@Injectable()
export class RepairCreateCaseService extends RepairBaseService {
  async execute(dto: CreateRepairCaseDto): Promise<RepairDetailViewDto> {
    const savedRepair = await this.repairsRepository.manager.transaction(
      async (manager) => {
        const item = await this.resolveInventoryItemOrThrow(dto.itemId, dto.imei, manager);
        this.ensureRepairableItem(item);

        const technicianId = dto.technicianId ?? dto.assignedTechnicianId;
        if (technicianId) {
          await this.getActiveTechnicianOrThrow(technicianId, manager);
        }

        const repairedAt = this.parseDateOrNow(dto.repairedAt);

        const repair = manager.getRepository(Repair).create({
          item,
          repairedAt,
          description: dto.description.trim(),
          status: dto.status ?? RepairStatus.PENDING,
          costTotal: this.toMoney(this.parseNumeric(dto.costTotal)),
          partsCost: dto.partsCost === undefined ? null : this.toMoney(this.parseNumeric(dto.partsCost)),
          laborCost: dto.laborCost === undefined ? null : this.toMoney(this.parseNumeric(dto.laborCost)),
          technician: technicianId ? ({ id: technicianId } as never) : null,
          notes: dto.notes?.trim() || null,
        });

        const createdRepair = await manager.getRepository(Repair).save(repair);

        const initialCost = this.parseNumeric(dto.costTotal);
        if (initialCost > 0) {
          const entry = manager.getRepository(RepairEntry).create({
            repair: createdRepair,
            entryAt: repairedAt,
            description: dto.description.trim(),
            costTotal: this.toMoney(initialCost),
            partsCost:
              dto.partsCost === undefined
                ? null
                : this.toMoney(this.parseNumeric(dto.partsCost)),
            laborCost:
              dto.laborCost === undefined
                ? null
                : this.toMoney(this.parseNumeric(dto.laborCost)),
            notes: dto.notes?.trim() || null,
          });

          await manager.getRepository(RepairEntry).save(entry);
        }

        const previousStatus = item.status;
        item.status = InventoryItemStatus.IN_REPAIR;
        await manager.getRepository(InventoryItem).save(item);
        await manager.getRepository(InventoryActivity).save(
          manager.getRepository(InventoryActivity).create({
            item,
            type: InventoryActivityType.MOVED_TO_REPAIR,
            fromStatus: previousStatus,
            toStatus: InventoryItemStatus.IN_REPAIR,
            notes: 'Repair case created from inventory flow',
          }),
        );

        return createdRepair;
      },
    );

    const repair = await this.getActiveRepairWithRelationsOrThrow(savedRepair.id);
    return toRepairDetailView(repair);
  }
}
