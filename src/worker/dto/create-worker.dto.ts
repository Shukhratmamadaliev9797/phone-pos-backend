import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { UserRole } from 'src/user/user/entities/user.entity';
import { WorkerRole } from '../entities/worker.entity';

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

  @ApiProperty()
  @IsString()
  @MaxLength(30)
  phoneNumber: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  address?: string;

  @ApiProperty()
  @Type(() => Number)
  @Min(0)
  monthlySalary: number;

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
