import { Injectable } from '@nestjs/common';
import { AddRepairEntryDto } from '../dto/add-repair-entry.dto';
import { RepairDetailViewDto } from '../dto/repair-result.dto';
import { RepairEntry } from '../entities/repair-entry.entity';
import { Repair } from '../entities/repair.entity';
import { toRepairDetailView } from '../helper';
import { RepairBaseService } from './repair-base.service';

@Injectable()
export class RepairAddEntryService extends RepairBaseService {
  async execute(id: number, dto: AddRepairEntryDto): Promise<RepairDetailViewDto> {
    await this.repairsRepository.manager.transaction(async (manager) => {
      const repair = await this.getActiveRepairOrThrow(id, manager);

      const entry = manager.getRepository(RepairEntry).create({
        repair,
        entryAt: this.parseDateOrNow(dto.entryAt),
        description: dto.description.trim(),
        costTotal: this.toMoney(this.parseNumeric(dto.costTotal)),
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

      const refreshedRepair = await this.getActiveRepairWithRelationsOrThrow(id, manager);
      this.recalculateRepairCosts(refreshedRepair);
      await manager.getRepository(Repair).save(refreshedRepair);
    });

    const repair = await this.getActiveRepairWithRelationsOrThrow(id);
    return toRepairDetailView(repair);
  }
}
