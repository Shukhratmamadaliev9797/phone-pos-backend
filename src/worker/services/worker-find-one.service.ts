import { Injectable } from '@nestjs/common';
import { WorkerDetailsViewDto } from '../dto/worker-result.dto';
import { toWorkerDetailsView } from '../helper';
import { WorkerBaseService } from './worker-base.service';

@Injectable()
export class WorkerFindOneService extends WorkerBaseService {
  async execute(id: number): Promise<WorkerDetailsViewDto> {
    const worker = await this.getActiveWorkerWithPaymentsOrThrow(id);
    return toWorkerDetailsView(worker);
  }
}
