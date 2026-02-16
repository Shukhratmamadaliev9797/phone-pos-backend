import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { WorkerRole, WorkerSalaryType } from '../entities/worker.entity';

export class WorkerViewDto {
  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  id: number;

  @ApiProperty()
  fullName: string;

  @ApiPropertyOptional()
  phoneNumber?: string | null;

  @ApiPropertyOptional()
  address?: string | null;

  @ApiProperty()
  monthlySalary: string;

  @ApiProperty({ enum: WorkerSalaryType })
  salaryType: WorkerSalaryType;

  @ApiPropertyOptional()
  salaryPercent?: string | null;

  @ApiProperty({ enum: WorkerRole })
  workerRole: WorkerRole;

  @ApiProperty()
  hasDashboardAccess: boolean;

  @ApiPropertyOptional()
  userId?: number | null;

  @ApiPropertyOptional()
  loginEmail?: string | null;

  @ApiPropertyOptional()
  notes?: string | null;

  @ApiProperty()
  soldPhonesCount: number;

  @ApiProperty()
  totalSoldAmount: string;

  @ApiProperty()
  totalProfitAmount: string;

  @ApiProperty()
  percentSalaryAccrued: string;
}

export class SalaryPaymentViewDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  workerId: number;

  @ApiProperty()
  month: string;

  @ApiProperty()
  amountPaid: string;

  @ApiProperty()
  paidAt: Date;

  @ApiPropertyOptional()
  notes?: string | null;
}

export class WorkerDetailsViewDto extends WorkerViewDto {
  @ApiProperty({ type: [SalaryPaymentViewDto] })
  payments: SalaryPaymentViewDto[];

  @ApiPropertyOptional()
  totalPaidThisMonth?: string;

  @ApiPropertyOptional()
  lastPaymentAt?: Date | null;
}

class PaginationMetaDto {
  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  totalPages: number;
}

export class WorkerListResponseDto {
  @ApiProperty({ type: [WorkerViewDto] })
  data: WorkerViewDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta: PaginationMetaDto;
}

export class WorkerSalaryPaymentListResponseDto {
  @ApiProperty({ type: [SalaryPaymentViewDto] })
  data: SalaryPaymentViewDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta: PaginationMetaDto;
}
