import { Injectable } from '@nestjs/common';
import { CreateSalaryPaymentDto } from '../dto/create-salary-payment.dto';
import { SalaryPaymentViewDto } from '../dto/worker-result.dto';
import { Worker, WorkerSalaryType } from '../entities/worker.entity';
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
        const amountPaid = this.parseNumeric(dto.amountPaid);

        const created = manager.getRepository(WorkerSalaryPayment).create({
          worker,
          month: this.normalizeMonth(dto.month),
          amountPaid: this.toMoney(amountPaid),
          paidAt: this.parseDateOrNow(dto.paidAt),
          notes: dto.notes?.trim() ?? null,
        });

        const savedPayment = await manager
          .getRepository(WorkerSalaryPayment)
          .save(created);

        if (worker.salaryType === WorkerSalaryType.PERCENT) {
          const currentRemaining = this.parseNumeric(
            worker.percentSalaryAccrued ?? 0,
          );
          const nextRemaining = Math.max(0, currentRemaining - amountPaid);

          worker.percentSalaryAccrued = this.toMoney(nextRemaining);

          // Reset sales stats only after the percent salary is fully paid.
          if (nextRemaining <= 0) {
            worker.soldPhonesCount = 0;
            worker.totalProfitAmount = this.toMoney(0);
          }

          await manager.getRepository(Worker).save(worker);
        }

        return savedPayment;
      },
    );

    return toSalaryPaymentView(payment);
  }
}
