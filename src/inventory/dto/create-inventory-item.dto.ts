import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsIn,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
  MaxLength,
  Min,
} from 'class-validator';
import {
  PurchasePaymentMethod,
} from 'src/purchase/entities/purchase.entity';
import {
  InventoryItemCondition,
  InventoryItemStatus,
} from '../entities/inventory-item.entity';

export class CreateInventoryCustomerDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  fullName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  phoneNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  address?: string;
}

export enum AddPhonePaymentType {
  FULL_PAYMENT = 'FULL_PAYMENT',
  PAY_LATER = 'PAY_LATER',
}

export class CreateInventoryItemDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(40)
  imei?: string;

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

  @ApiPropertyOptional({
    enum: [InventoryItemStatus.IN_STOCK, InventoryItemStatus.SOLD],
    default: InventoryItemStatus.IN_STOCK,
  })
  @IsOptional()
  @IsEnum(InventoryItemStatus)
  @IsIn([InventoryItemStatus.IN_STOCK, InventoryItemStatus.SOLD])
  status?: InventoryItemStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  knownIssues?: string;

  @ApiProperty()
  @Type(() => Number)
  @Min(0)
  expectedSalePrice: number;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isPhonePurchased?: boolean;

  @ApiPropertyOptional({ enum: PurchasePaymentMethod, default: PurchasePaymentMethod.CASH })
  @IsOptional()
  @IsEnum(PurchasePaymentMethod)
  paymentMethod?: PurchasePaymentMethod;

  @ApiPropertyOptional({ enum: AddPhonePaymentType, default: AddPhonePaymentType.FULL_PAYMENT })
  @IsOptional()
  @IsEnum(AddPhonePaymentType)
  paymentType?: AddPhonePaymentType;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @Min(0)
  initialPayment?: number;

  @ApiPropertyOptional({ type: () => CreateInventoryCustomerDto })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => CreateInventoryCustomerDto)
  customer?: CreateInventoryCustomerDto;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  needsRepair?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  repairDescription?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @Min(0)
  repairCost?: number;
}
