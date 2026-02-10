import { Injectable } from '@nestjs/common';
import { CreateSalaryPaymentDto } from '../dto/create-salary-payment.dto';
import { SalaryPaymentViewDto } from '../dto/worker-result.dto';
import { WorkerSalaryPayment } from '../entities/worker-salary-payment.entity';
import { toSalaryPaymentView } from '../helper';
import { WorkerBaseService } from './worker-base.service';

@Injectable()
export class WorkerSalaryPayService extends WorkerBaseService {
  async execute(
    workerId: number,
    dto: CreateSalaryPaymentDto,
  ): Promise<SalaryPaymentViewDto> {
    const payment = await this.workersRepository.manager.transaction(
      async (manager) => {
        const worker = await this.getActiveWorkerOrThrow(workerId, manager);

        const created = manager.getRepository(WorkerSalaryPayment).create({
          worker,
          month: this.normalizeMonth(dto.month),
          amountPaid: this.toMoney(this.parseNumeric(dto.amountPaid)),
          paidAt: this.parseDateOrNow(dto.paidAt),
          notes: dto.notes?.trim() ?? null,
        });

        return manager.getRepository(WorkerSalaryPayment).save(created);
      },
    );

    return toSalaryPaymentView(payment);
  }
}
