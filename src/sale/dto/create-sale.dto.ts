import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { SalePaymentMethod, SalePaymentType } from '../entities/sale.entity';

export class CreateSaleItemDto {
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  itemId?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(40)
  imei?: string;

  @ApiProperty({ example: 200 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  salePrice: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateSaleCustomerDto {
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

export class CreateSaleDto {
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

  @ApiPropertyOptional({ type: CreateSaleCustomerDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateSaleCustomerDto)
  customer?: CreateSaleCustomerDto;

  @ApiProperty({ enum: SalePaymentMethod })
  @IsEnum(SalePaymentMethod)
  paymentMethod: SalePaymentMethod;

  @ApiProperty({ enum: SalePaymentType })
  @IsEnum(SalePaymentType)
  paymentType: SalePaymentType;

  @ApiPropertyOptional({ example: 0 })
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

  @ApiPropertyOptional({ example: 150000 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  profit?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ type: [CreateSaleItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateSaleItemDto)
  items: CreateSaleItemDto[];
}
