import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  IsISO8601,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import {
  InitialPurchaseItemStatus,
} from './create-purchase.dto';
import { InventoryItemCondition } from 'src/inventory/entities/inventory-item.entity';
import {
  PurchasePaymentMethod,
  PurchasePaymentType,
} from '../entities/purchase.entity';

export class UpdatePurchaseCustomerDto {
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
}

export class UpdatePurchaseItemDto {
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  itemId?: number;

  @ApiProperty()
  @IsString()
  @MaxLength(40)
  imei: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(50)
  serialNumber?: string;

  @ApiProperty()
  @IsString()
  @MaxLength(80)
  brand: string;

  @ApiProperty()
  @IsString()
  @MaxLength(80)
  model: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(40)
  storage?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(40)
  color?: string;

  @ApiProperty({ enum: InventoryItemCondition })
  @IsEnum(InventoryItemCondition)
  condition: InventoryItemCondition;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  knownIssues?: string;

  @ApiPropertyOptional({ enum: InitialPurchaseItemStatus })
  @IsOptional()
  @IsEnum(InitialPurchaseItemStatus)
  initialStatus?: InitialPurchaseItemStatus;

  @ApiProperty({ example: 100 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  purchasePrice: number;
}

export class UpdatePurchaseDto {
  @ApiPropertyOptional({ description: 'ISO timestamp' })
  @IsOptional()
  @IsISO8601()
  purchasedAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  customerId?: number;

  @ApiPropertyOptional({ type: UpdatePurchaseCustomerDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => UpdatePurchaseCustomerDto)
  customer?: UpdatePurchaseCustomerDto;

  @ApiPropertyOptional({ enum: PurchasePaymentMethod })
  @IsOptional()
  @IsEnum(PurchasePaymentMethod)
  paymentMethod?: PurchasePaymentMethod;

  @ApiPropertyOptional({ enum: PurchasePaymentType })
  @IsOptional()
  @IsEnum(PurchasePaymentType)
  paymentType?: PurchasePaymentType;

  @ApiPropertyOptional({ example: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  paidNow?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ type: [UpdatePurchaseItemDto] })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => UpdatePurchaseItemDto)
  items?: UpdatePurchaseItemDto[];
}
