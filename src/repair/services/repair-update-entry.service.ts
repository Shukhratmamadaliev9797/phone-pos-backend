import { Injectable, NotFoundException } from '@nestjs/common';
import { UpdateRepairEntryDto } from '../dto/update-repair-entry.dto';
import { RepairDetailViewDto } from '../dto/repair-result.dto';
import { RepairEntry } from '../entities/repair-entry.entity';
import { Repair } from '../entities/repair.entity';
import { toRepairDetailView } from '../helper';
import { RepairBaseService } from './repair-base.service';

@Injectable()
export class RepairUpdateEntryService extends RepairBaseService {
  async execute(
    entryId: number,
    dto: UpdateRepairEntryDto,
  ): Promise<RepairDetailViewDto> {
    let repairId = 0;

    await this.repairsRepository.manager.transaction(async (manager) => {
      const entry = await manager.getRepository(RepairEntry).findOne({
        where: { id: entryId, isActive: true },
      });

      if (!entry) {
        throw new NotFoundException('Repair entry not found');
      }

      repairId = entry.repairId;

      if (dto.description !== undefined) {
        entry.description = dto.description.trim();
      }

      if (dto.entryAt !== undefined) {
        entry.entryAt = this.parseDateOrNow(dto.entryAt);
      }

      if (dto.costTotal !== undefined) {
        entry.costTotal = this.toMoney(this.parseNumeric(dto.costTotal));
      }

      if (dto.partsCost !== undefined) {
        entry.partsCost = this.toMoney(this.parseNumeric(dto.partsCost));
      }

      if (dto.laborCost !== undefined) {
        entry.laborCost = this.toMoney(this.parseNumeric(dto.laborCost));
      }

      if (dto.notes !== undefined) {
        entry.notes = dto.notes?.trim() || null;
      }

      await manager.getRepository(RepairEntry).save(entry);

      const repair = await this.getActiveRepairWithRelationsOrThrow(repairId, manager);
      this.recalculateRepairCosts(repair);
      await manager.getRepository(Repair).save(repair);
    });

    const repair = await this.getActiveRepairWithRelationsOrThrow(repairId);
    return toRepairDetailView(repair);
  }
}
