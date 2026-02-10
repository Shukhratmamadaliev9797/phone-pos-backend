import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import {
  InventoryItemCondition,
  InventoryItemStatus,
} from '../entities/inventory-item.entity';

export class CreateInventoryItemDto {
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

  @ApiPropertyOptional({ enum: InventoryItemStatus, default: InventoryItemStatus.IN_STOCK })
  @IsOptional()
  @IsEnum(InventoryItemStatus)
  status?: InventoryItemStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  knownIssues?: string;

  @ApiProperty()
  @Type(() => Number)
  @Min(0)
  expectedSalePrice: number;
}
