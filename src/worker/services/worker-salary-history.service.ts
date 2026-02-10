import { Injectable } from '@nestjs/common';
import { WorkerSalaryPaymentQueryDto } from '../dto/worker-query.dto';
import { WorkerSalaryPaymentListResponseDto } from '../dto/worker-result.dto';
import { toSalaryPaymentView } from '../helper';
import { WorkerBaseService } from './worker-base.service';

@Injectable()
export class WorkerSalaryHistoryService extends WorkerBaseService {
  async execute(
    workerId: number,
    query: WorkerSalaryPaymentQueryDto,
  ): Promise<WorkerSalaryPaymentListResponseDto> {
    await this.getActiveWorkerOrThrow(workerId);

    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    const builder = this.workerSalaryPaymentsRepository
      .createQueryBuilder('salaryPayment')
      .where('salaryPayment.workerId = :workerId', { workerId })
      .andWhere('salaryPayment.isActive = :isActive', { isActive: true })
      .orderBy('salaryPayment.paidAt', 'DESC')
      .addOrderBy('salaryPayment.id', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (query.fromMonth) {
      builder.andWhere('salaryPayment.month >= :fromMonth', {
        fromMonth: this.normalizeMonth(query.fromMonth),
      });
    }

    if (query.toMonth) {
      builder.andWhere('salaryPayment.month <= :toMonth', {
        toMonth: this.normalizeMonth(query.toMonth),
      });
    }

    const [data, total] = await builder.getManyAndCount();

    return {
      data: data.map(toSalaryPaymentView),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }
}
