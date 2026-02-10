import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import {
  InventoryItemCondition,
  InventoryItemStatus,
} from 'src/inventory/entities/inventory-item.entity';
import { RepairStatus } from '../entities/repair.entity';

export class RepairItemDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  imei: string;

  @ApiProperty()
  brand: string;

  @ApiProperty()
  model: string;

  @ApiProperty({ enum: InventoryItemStatus })
  status: InventoryItemStatus;

  @ApiProperty({ enum: InventoryItemCondition })
  condition: InventoryItemCondition;
}

export class RepairTechnicianDto {
  @ApiProperty()
  id: number;

  @ApiPropertyOptional()
  username?: string;

  @ApiPropertyOptional()
  fullName?: string;
}

export class RepairEntryViewDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  entryAt: Date;

  @ApiProperty()
  description: string;

  @ApiProperty()
  costTotal: string;

  @ApiPropertyOptional()
  partsCost?: string | null;

  @ApiPropertyOptional()
  laborCost?: string | null;

  @ApiPropertyOptional()
  notes?: string | null;
}

export class RepairViewDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  repairedAt: Date;

  @ApiPropertyOptional()
  createdAt?: Date;

  @ApiProperty()
  itemId: number;

  @ApiPropertyOptional()
  technicianId?: number | null;

  @ApiProperty()
  description: string;

  @ApiProperty({ enum: RepairStatus })
  status: RepairStatus;

  @ApiProperty()
  costTotal: string;

  @ApiPropertyOptional()
  partsCost?: string | null;

  @ApiPropertyOptional()
  laborCost?: string | null;

  @ApiPropertyOptional()
  notes?: string | null;

  @ApiPropertyOptional({ type: RepairItemDto })
  item?: RepairItemDto | null;

  @ApiPropertyOptional({ type: RepairTechnicianDto })
  technician?: RepairTechnicianDto | null;
}

export class RepairDetailViewDto extends RepairViewDto {
  @ApiProperty({ type: [RepairEntryViewDto] })
  entries: RepairEntryViewDto[];

  @ApiProperty()
  totalRepairSpent: string;

  @ApiProperty()
  totalCost: string;
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

export class RepairListResponseDto {
  @ApiProperty({ type: [RepairViewDto] })
  data: RepairViewDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta: PaginationMetaDto;
}

export class RepairListQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: RepairStatus })
  @IsOptional()
  @IsEnum(RepairStatus)
  status?: RepairStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  technicianId?: number;
}

export class RepairAvailableItemDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  imei: string;

  @ApiProperty()
  brand: string;

  @ApiProperty()
  model: string;

  @ApiProperty({ enum: InventoryItemCondition })
  condition: InventoryItemCondition;

  @ApiProperty({ enum: InventoryItemStatus })
  status: InventoryItemStatus;
}

export class RepairAvailableItemsQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  q?: string;
}
