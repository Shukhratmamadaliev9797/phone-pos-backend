import { Injectable, NotFoundException } from '@nestjs/common';
import { RepairDetailViewDto } from '../dto/repair-result.dto';
import { RepairEntry } from '../entities/repair-entry.entity';
import { Repair } from '../entities/repair.entity';
import { toRepairDetailView } from '../helper';
import { RepairBaseService } from './repair-base.service';

@Injectable()
export class RepairDeleteEntryService extends RepairBaseService {
  async execute(entryId: number): Promise<RepairDetailViewDto> {
    let repairId = 0;

    await this.repairsRepository.manager.transaction(async (manager) => {
      const entry = await manager.getRepository(RepairEntry).findOne({
        where: { id: entryId, isActive: true },
      });

      if (!entry) {
        throw new NotFoundException('Repair entry not found');
      }

      repairId = entry.repairId;
      entry.isActive = false;
      entry.deletedAt = new Date();
      await manager.getRepository(RepairEntry).save(entry);

      const repair = await this.getActiveRepairWithRelationsOrThrow(repairId, manager);
      this.recalculateRepairCosts(repair);
      await manager.getRepository(Repair).save(repair);
    });

    const repair = await this.getActiveRepairWithRelationsOrThrow(repairId);
    return toRepairDetailView(repair);
  }
}
