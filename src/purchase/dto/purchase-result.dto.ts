import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsISO8601, IsInt, IsOptional, Min } from 'class-validator';
import {
  InventoryItemCondition,
  InventoryItemStatus,
} from 'src/inventory/entities/inventory-item.entity';
import {
  PurchasePaymentMethod,
  PurchasePaymentType,
} from '../entities/purchase.entity';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';

export class PurchaseItemInventoryDto {
  @ApiProperty()
  imei: string;

  @ApiPropertyOptional()
  serialNumber?: string | null;

  @ApiProperty()
  brand: string;

  @ApiProperty()
  model: string;

  @ApiPropertyOptional()
  storage?: string | null;

  @ApiPropertyOptional()
  color?: string | null;

  @ApiProperty({ enum: InventoryItemStatus })
  status: InventoryItemStatus;

  @ApiProperty({ enum: InventoryItemCondition })
  condition: InventoryItemCondition;

  @ApiPropertyOptional()
  knownIssues?: string | null;
}

export class PurchaseItemViewDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  itemId: number;

  @ApiProperty()
  purchasePrice: string;

  @ApiPropertyOptional()
  notes?: string | null;

  @ApiProperty({ type: PurchaseItemInventoryDto })
  item: PurchaseItemInventoryDto;
}

export class PurchaseCustomerDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  fullName: string;

  @ApiProperty()
  phoneNumber: string;

  @ApiPropertyOptional()
  address?: string | null;
}

export class PurchaseViewDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  purchasedAt: Date;

  @ApiPropertyOptional()
  customerId?: number | null;

  @ApiProperty({ enum: PurchasePaymentMethod })
  paymentMethod: PurchasePaymentMethod;

  @ApiProperty({ enum: PurchasePaymentType })
  paymentType: PurchasePaymentType;

  @ApiProperty()
  totalPrice: string;

  @ApiProperty()
  paidNow: string;

  @ApiProperty()
  remaining: string;

  @ApiPropertyOptional()
  notes?: string | null;

  @ApiPropertyOptional({ type: PurchaseCustomerDto })
  customer?: PurchaseCustomerDto | null;
}

export class PurchaseListViewDto extends PurchaseViewDto {
  @ApiProperty()
  itemsCount: number;

  @ApiPropertyOptional()
  phoneLabel?: string | null;

  @ApiPropertyOptional({ enum: InventoryItemStatus })
  phoneStatus?: InventoryItemStatus | null;
}

export class PurchasePaymentActivityDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  paidAt: Date;

  @ApiProperty()
  amount: string;

  @ApiPropertyOptional()
  notes?: string | null;
}

export class PurchaseDetailViewDto extends PurchaseViewDto {
  @ApiProperty({ type: [PurchaseItemViewDto] })
  items: PurchaseItemViewDto[];

  @ApiProperty({ type: [PurchasePaymentActivityDto] })
  activities: PurchasePaymentActivityDto[];
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

export class PurchaseListResponseDto {
  @ApiProperty({ type: [PurchaseListViewDto] })
  data: PurchaseListViewDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta: PaginationMetaDto;
}

export class PurchaseListQueryDto extends PaginationQueryDto {
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

  @ApiPropertyOptional({ enum: PurchasePaymentType })
  @IsOptional()
  @IsEnum(PurchasePaymentType)
  paymentType?: PurchasePaymentType;
}
