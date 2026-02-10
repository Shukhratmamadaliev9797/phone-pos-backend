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
  InventoryItemCondition,
  InventoryItemStatus,
} from 'src/inventory/entities/inventory-item.entity';
import {
  PurchasePaymentMethod,
  PurchasePaymentType,
} from '../entities/purchase.entity';

export enum InitialPurchaseItemStatus {
  IN_STOCK = InventoryItemStatus.IN_STOCK,
  IN_REPAIR = InventoryItemStatus.IN_REPAIR,
}

export class CreatePurchaseItemDto {
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

  @ApiProperty({ example: 150 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  purchasePrice: number;

  @ApiPropertyOptional({ enum: InitialPurchaseItemStatus })
  @IsOptional()
  @IsEnum(InitialPurchaseItemStatus)
  initialStatus?: InitialPurchaseItemStatus;
}

export class CreatePurchaseCustomerDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  fullName?: string;

  @ApiProperty()
  @IsString()
  @MaxLength(30)
  phoneNumber: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  address?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(50)
  passportId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreatePurchaseDto {
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

  @ApiPropertyOptional({ type: CreatePurchaseCustomerDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => CreatePurchaseCustomerDto)
  customer?: CreatePurchaseCustomerDto;

  @ApiProperty({ enum: PurchasePaymentMethod })
  @IsEnum(PurchasePaymentMethod)
  paymentMethod: PurchasePaymentMethod;

  @ApiProperty({ enum: PurchasePaymentType })
  @IsEnum(PurchasePaymentType)
  paymentType: PurchasePaymentType;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  paidNow?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ type: [CreatePurchaseItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreatePurchaseItemDto)
  items: CreatePurchaseItemDto[];
}
