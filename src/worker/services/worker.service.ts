import { Injectable } from '@nestjs/common';
import { CreateSalaryPaymentDto } from '../dto/create-salary-payment.dto';
import { CreateWorkerDto } from '../dto/create-worker.dto';
import { WorkerQueryDto, WorkerSalaryPaymentQueryDto } from '../dto/worker-query.dto';
import {
  SalaryPaymentViewDto,
  WorkerDetailsViewDto,
  WorkerListResponseDto,
  WorkerSalaryPaymentListResponseDto,
  WorkerViewDto,
} from '../dto/worker-result.dto';
import { UpdateWorkerDto } from '../dto/update-worker.dto';
import { WorkerCreateService } from './worker-create.service';
import { WorkerDeleteService } from './worker-delete.service';
import { WorkerFindAllService } from './worker-find-all.service';
import { WorkerFindOneService } from './worker-find-one.service';
import { WorkerSalaryHistoryService } from './worker-salary-history.service';
import { WorkerSalaryPayService } from './worker-salary-pay.service';
import { WorkerUpdateService } from './worker-update.service';

@Injectable()
export class WorkerService {
  constructor(
    private readonly createService: WorkerCreateService,
    private readonly updateService: WorkerUpdateService,
    private readonly findAllService: WorkerFindAllService,
    private readonly findOneService: WorkerFindOneService,
    private readonly salaryPayService: WorkerSalaryPayService,
    private readonly salaryHistoryService: WorkerSalaryHistoryService,
    private readonly deleteService: WorkerDeleteService,
  ) {}

  async create(dto: CreateWorkerDto): Promise<WorkerViewDto> {
    return this.createService.execute(dto);
  }

  async update(id: number, dto: UpdateWorkerDto): Promise<WorkerViewDto> {
    return this.updateService.execute(id, dto);
  }

  async findAll(query: WorkerQueryDto): Promise<WorkerListResponseDto> {
    return this.findAllService.execute(query);
  }

  async findOne(id: number): Promise<WorkerDetailsViewDto> {
    return this.findOneService.execute(id);
  }

  async paySalary(
    id: number,
    dto: CreateSalaryPaymentDto,
  ): Promise<SalaryPaymentViewDto> {
    return this.salaryPayService.execute(id, dto);
  }

  async salaryHistory(
    id: number,
    query: WorkerSalaryPaymentQueryDto,
  ): Promise<WorkerSalaryPaymentListResponseDto> {
    return this.salaryHistoryService.execute(id, query);
  }

  async softDelete(id: number): Promise<{ success: true }> {
    return this.deleteService.execute(id);
  }
}
