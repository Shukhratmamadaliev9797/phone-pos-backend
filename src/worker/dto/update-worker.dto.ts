import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { UserRole } from 'src/user/user/entities/user.entity';
import { WorkerRole, WorkerSalaryType } from '../entities/worker.entity';

export class UpdateWorkerLoginDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  @MaxLength(120)
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  password?: string;

  @ApiPropertyOptional({
    enum: [
      UserRole.OWNER_ADMIN,
      UserRole.MANAGER,
      UserRole.CASHIER,
      UserRole.TECHNICIAN,
    ],
  })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}

export class UpdateWorkerDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  fullName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(30)
  phoneNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  address?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @ValidateIf((dto: UpdateWorkerDto) => dto.salaryType === WorkerSalaryType.MONTHLY)
  @Type(() => Number)
  @Min(0)
  monthlySalary?: number;

  @ApiPropertyOptional({ enum: WorkerSalaryType })
  @IsOptional()
  @IsEnum(WorkerSalaryType)
  salaryType?: WorkerSalaryType;

  @ApiPropertyOptional()
  @IsOptional()
  @ValidateIf((dto: UpdateWorkerDto) => dto.salaryType === WorkerSalaryType.PERCENT)
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  salaryPercent?: number;

  @ApiPropertyOptional({ enum: WorkerRole })
  @IsOptional()
  @IsEnum(WorkerRole)
  workerRole?: WorkerRole;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  hasDashboardAccess?: boolean;

  @ApiPropertyOptional({ type: UpdateWorkerLoginDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateWorkerLoginDto)
  login?: UpdateWorkerLoginDto;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
