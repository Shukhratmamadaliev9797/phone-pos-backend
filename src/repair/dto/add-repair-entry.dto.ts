import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class AddRepairEntryDto {
  @ApiProperty()
  @IsString()
  @MaxLength(1000)
  description: string;

  @ApiProperty()
  @Type(() => Number)
  @Min(0.01)
  costTotal: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @Min(0)
  partsCost?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @Min(0)
  laborCost?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  entryAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}
