import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsISO8601,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { SalePaymentMethod, SalePaymentType } from '../entities/sale.entity';

export class UpdateSaleItemDto {
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  itemId?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  imei?: string;

  @ApiPropertyOptional({ example: 50 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  salePrice: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateSaleCustomerDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  fullName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  passportId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateSaleDto {
  @ApiPropertyOptional({ description: 'ISO timestamp' })
  @IsOptional()
  @IsISO8601()
  soldAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  customerId?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  sellerWorkerId?: number;

  @ApiPropertyOptional({ type: UpdateSaleCustomerDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateSaleCustomerDto)
  customer?: UpdateSaleCustomerDto;

  @ApiPropertyOptional({ enum: SalePaymentMethod })
  @IsOptional()
  @IsEnum(SalePaymentMethod)
  paymentMethod?: SalePaymentMethod;

  @ApiPropertyOptional({ enum: SalePaymentType })
  @IsOptional()
  @IsEnum(SalePaymentType)
  paymentType?: SalePaymentType;

  @ApiPropertyOptional({ example: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  paidNow?: number;

  @ApiPropertyOptional({ example: 6 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  installmentMonths?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  firstPaymentNow?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ type: [UpdateSaleItemDto] })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => UpdateSaleItemDto)
  items?: UpdateSaleItemDto[];
}
