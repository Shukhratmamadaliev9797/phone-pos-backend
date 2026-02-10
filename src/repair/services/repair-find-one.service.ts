import { Injectable } from '@nestjs/common';
import { RepairDetailViewDto } from '../dto/repair-result.dto';
import { toRepairDetailView } from '../helper';
import { RepairBaseService } from './repair-base.service';

@Injectable()
export class RepairFindOneService extends RepairBaseService {
  async execute(id: number): Promise<RepairDetailViewDto> {
    const repair = await this.getActiveRepairWithRelationsOrThrow(id);
    return toRepairDetailView(repair);
  }
}
