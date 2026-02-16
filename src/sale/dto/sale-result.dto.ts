import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsISO8601, IsInt, IsOptional, Min } from 'class-validator';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import {
  InventoryItemCondition,
  InventoryItemStatus,
} from 'src/inventory/entities/inventory-item.entity';
import { SalePaymentMethod, SalePaymentType } from '../entities/sale.entity';

export class SaleItemInventoryDto {
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

  @ApiPropertyOptional()
  storage?: string | null;

  @ApiPropertyOptional()
  color?: string | null;

  @ApiPropertyOptional()
  serialNumber?: string | null;

  @ApiPropertyOptional()
  knownIssues?: string | null;
}

export class SaleItemViewDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  itemId: number;

  @ApiProperty()
  salePrice: string;

  @ApiPropertyOptional()
  notes?: string | null;

  @ApiProperty({ type: SaleItemInventoryDto })
  item: SaleItemInventoryDto;
}

export class SaleCustomerDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  fullName: string;

  @ApiProperty()
  phoneNumber: string;

  @ApiPropertyOptional()
  address?: string | null;
}

export class SaleViewDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  soldAt: Date;

  @ApiPropertyOptional()
  customerId?: number | null;

  @ApiPropertyOptional()
  sellerWorkerId?: number | null;

  @ApiProperty({ enum: SalePaymentMethod })
  paymentMethod: SalePaymentMethod;

  @ApiProperty({ enum: SalePaymentType })
  paymentType: SalePaymentType;

  @ApiProperty()
  totalPrice: string;

  @ApiProperty()
  paidNow: string;

  @ApiProperty()
  remaining: string;

  @ApiPropertyOptional()
  installmentMonths?: number | null;

  @ApiPropertyOptional()
  firstPaymentNow?: boolean | null;

  @ApiPropertyOptional()
  monthlyInstallmentAmount?: string | null;

  @ApiPropertyOptional()
  profit?: string | null;

  @ApiPropertyOptional()
  notes?: string | null;

  @ApiPropertyOptional({ type: SaleCustomerDto })
  customer?: SaleCustomerDto | null;
}

export class SaleListViewDto extends SaleViewDto {
  @ApiProperty()
  itemsCount: number;

  @ApiPropertyOptional()
  phoneLabel?: string | null;
}

export class SalePaymentActivityDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  paidAt: Date;

  @ApiProperty()
  amount: string;

  @ApiPropertyOptional()
  notes?: string | null;
}

export class SaleDetailViewDto extends SaleViewDto {
  @ApiProperty({ type: [SaleItemViewDto] })
  items: SaleItemViewDto[];

  @ApiProperty({ type: [SalePaymentActivityDto] })
  activities: SalePaymentActivityDto[];
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

  @ApiPropertyOptional()
  totalPriceSum?: string;

  @ApiPropertyOptional()
  remainingSum?: string;
}

export class SaleListResponseDto {
  @ApiProperty({ type: [SaleListViewDto] })
  data: SaleListViewDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta: PaginationMetaDto;
}

export class SaleListQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'ISO date-time from' })
  @IsOptional()
  @IsISO8601()
  from?: string;

  @ApiPropertyOptional({ description: 'ISO date-time to' })
  @IsOptional()
  @IsISO8601()
  to?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  customerId?: number;

  @ApiPropertyOptional({ enum: SalePaymentType })
  @IsOptional()
  @IsEnum(SalePaymentType)
  paymentType?: SalePaymentType;
}

export class SaleAvailableItemsQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  q?: string;
}

export class SaleAvailableItemDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  purchaseId: number;

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

  @ApiProperty()
  purchasePrice: string;
}
