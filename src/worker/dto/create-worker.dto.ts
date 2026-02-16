import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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

export class WorkerLoginDto {
  @ApiProperty()
  @IsEmail()
  @MaxLength(120)
  email: string;

  @ApiProperty()
  @IsString()
  @MaxLength(120)
  password: string;

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

export class CreateWorkerDto {
  @ApiProperty()
  @IsString()
  @MaxLength(120)
  fullName: string;

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
  @ValidateIf((dto: CreateWorkerDto) => dto.salaryType === WorkerSalaryType.MONTHLY)
  @Type(() => Number)
  @Min(0)
  monthlySalary?: number;

  @ApiProperty({ enum: WorkerSalaryType })
  @IsEnum(WorkerSalaryType)
  salaryType: WorkerSalaryType;

  @ApiPropertyOptional()
  @ValidateIf((dto: CreateWorkerDto) => dto.salaryType === WorkerSalaryType.PERCENT)
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  salaryPercent?: number;

  @ApiProperty({ enum: WorkerRole })
  @IsEnum(WorkerRole)
  workerRole: WorkerRole;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  hasDashboardAccess?: boolean;

  @ApiPropertyOptional({ type: WorkerLoginDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => WorkerLoginDto)
  login?: WorkerLoginDto;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
