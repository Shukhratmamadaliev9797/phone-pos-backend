import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { CustomerViewDto } from './customer-view.dto';
import { CustomerQueryDto } from './customer-query.dto';

export enum CustomerBalanceType {
  ALL = 'all',
  DEBT = 'debt',
  CREDIT = 'credit',
}

export class CustomerBalancesQueryDto extends CustomerQueryDto {
  @ApiPropertyOptional({ enum: CustomerBalanceType, default: CustomerBalanceType.ALL })
  @IsOptional()
  @IsEnum(CustomerBalanceType)
  type?: CustomerBalanceType = CustomerBalanceType.ALL;
}

export class CustomerBalanceRowDto {
  @ApiProperty({ type: CustomerViewDto })
  customer: CustomerViewDto;

  @ApiProperty()
  debt: number;

  @ApiProperty()
  credit: number;

  @ApiPropertyOptional()
  lastActivityAt?: string | null;

  @ApiPropertyOptional()
  lastPaymentAt?: string | null;

  @ApiPropertyOptional()
  lastPaymentAmount?: number;

  @ApiPropertyOptional()
  soldPhones?: string | null;

  @ApiPropertyOptional()
  purchasedPhones?: string | null;

  @ApiProperty()
  totalDue: number;
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

export class CustomerBalancesResponseDto {
  @ApiProperty({ type: [CustomerBalanceRowDto] })
  data: CustomerBalanceRowDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta: PaginationMetaDto;
}
