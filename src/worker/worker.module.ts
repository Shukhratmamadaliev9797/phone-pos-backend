import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/user/user/entities/user.entity';
import { WorkerController } from './worker.controller';
import { WorkerSalaryPayment } from './entities/worker-salary-payment.entity';
import { Worker } from './entities/worker.entity';
import { WorkerBaseService } from './services/worker-base.service';
import { WorkerCreateService } from './services/worker-create.service';
import { WorkerDeleteService } from './services/worker-delete.service';
import { WorkerFindAllService } from './services/worker-find-all.service';
import { WorkerFindOneService } from './services/worker-find-one.service';
import { WorkerSalaryHistoryService } from './services/worker-salary-history.service';
import { WorkerSalaryPayService } from './services/worker-salary-pay.service';
import { WorkerService } from './services/worker.service';
import { WorkerUpdateService } from './services/worker-update.service';

@Module({
  imports: [TypeOrmModule.forFeature([Worker, WorkerSalaryPayment, User])],
  controllers: [WorkerController],
  providers: [
    WorkerBaseService,
    WorkerCreateService,
    WorkerUpdateService,
    WorkerFindAllService,
    WorkerFindOneService,
    WorkerSalaryPayService,
    WorkerSalaryHistoryService,
    WorkerDeleteService,
    WorkerService,
  ],
  exports: [WorkerService],
})
export class WorkerModule {}
