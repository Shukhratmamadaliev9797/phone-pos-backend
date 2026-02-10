import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CustomerViewDto } from './customer-view.dto';

export class CustomerActivityDto {
  @ApiProperty()
  type: 'SALE_PAYMENT' | 'PURCHASE_PAYMENT';

  @ApiProperty()
  paidAt: Date;

  @ApiProperty()
  amount: number;

  @ApiPropertyOptional()
  notes?: string | null;
}

export class CustomerOpenSaleRefDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  remaining: number;

  @ApiProperty()
  soldAt: Date;
}

export class CustomerOpenPurchaseRefDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  remaining: number;

  @ApiProperty()
  purchasedAt: Date;
}

export class CustomerDetailDto {
  @ApiProperty({ type: CustomerViewDto })
  customer: CustomerViewDto;

  @ApiProperty()
  debt: number;

  @ApiProperty()
  credit: number;

  @ApiProperty()
  totalDue: number;

  @ApiPropertyOptional()
  soldPhones?: string | null;

  @ApiPropertyOptional()
  purchasedPhones?: string | null;

  @ApiPropertyOptional()
  lastActivityAt?: string | null;

  @ApiPropertyOptional()
  lastPaymentAt?: string | null;

  @ApiPropertyOptional()
  lastPaymentAmount?: number;

  @ApiProperty({ type: [CustomerActivityDto] })
  activities: CustomerActivityDto[];

  @ApiProperty({ type: [CustomerOpenSaleRefDto] })
  openSales: CustomerOpenSaleRefDto[];

  @ApiProperty({ type: [CustomerOpenPurchaseRefDto] })
  openPurchases: CustomerOpenPurchaseRefDto[];
}
