import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import {
  InventoryItemCondition,
  InventoryItemStatus,
} from '../entities/inventory-item.entity';

export class InventoryItemsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({ enum: InventoryItemStatus })
  @IsOptional()
  @IsEnum(InventoryItemStatus)
  status?: InventoryItemStatus;

  @ApiPropertyOptional({ enum: InventoryItemCondition })
  @IsOptional()
  @IsEnum(InventoryItemCondition)
  condition?: InventoryItemCondition;
}

export class InventoryListItemDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  itemName: string;

  @ApiProperty()
  brand: string;

  @ApiProperty()
  model: string;

  @ApiProperty()
  imei: string;

  @ApiPropertyOptional()
  storage?: string | null;

  @ApiPropertyOptional()
  serialNumber?: string | null;

  @ApiPropertyOptional()
  purchaseId?: number | null;

  @ApiPropertyOptional()
  saleId?: number | null;

  @ApiProperty({ enum: InventoryItemCondition })
  condition: InventoryItemCondition;

  @ApiProperty({ enum: InventoryItemStatus })
  status: InventoryItemStatus;

  @ApiProperty()
  cost: number;

  @ApiProperty()
  purchaseCost: number;

  @ApiProperty()
  repairCost: number;

  @ApiPropertyOptional()
  expectedSalePrice?: number | null;

  @ApiPropertyOptional()
  knownIssues?: string | null;
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

export class InventoryListResponseDto {
  @ApiProperty({ type: [InventoryListItemDto] })
  data: InventoryListItemDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta: PaginationMetaDto;
}
