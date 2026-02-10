import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { WorkerRole } from '../entities/worker.entity';

export class WorkerQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: WorkerRole })
  @IsOptional()
  @IsEnum(WorkerRole)
  workerRole?: WorkerRole;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  hasDashboardAccess?: boolean;
}

export class WorkerSalaryPaymentQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ example: '2026-01' })
  @IsOptional()
  @IsString()
  fromMonth?: string;

  @ApiPropertyOptional({ example: '2026-12' })
  @IsOptional()
  @IsString()
  toMonth?: string;
}
