import { Injectable } from '@nestjs/common';
import { Worker } from '../entities/worker.entity';
import { WorkerSalaryPayment } from '../entities/worker-salary-payment.entity';
import { WorkerBaseService } from './worker-base.service';

@Injectable()
export class WorkerDeleteService extends WorkerBaseService {
  async execute(id: number): Promise<{ success: true }> {
    await this.workersRepository.manager.transaction(async (manager) => {
      const worker = await this.getActiveWorkerOrThrow(id, manager);
      const now = new Date();

      await manager
        .getRepository(WorkerSalaryPayment)
        .createQueryBuilder()
        .update(WorkerSalaryPayment)
        .set({ isActive: false, deletedAt: now })
        .where('workerId = :workerId', { workerId: id })
        .andWhere('isActive = :isActive', { isActive: true })
        .execute();

      if (worker.userId) {
        await this.deactivateLinkedUser(worker.userId, manager);
      }

      worker.user = null;
      worker.hasDashboardAccess = false;
      worker.isActive = false;
      worker.deletedAt = now;

      await manager.getRepository(Worker).save(worker);
    });

    return { success: true };
  }
}
