import { ApiProperty } from '@nestjs/swagger';

class DashboardKpiItemDto {
  @ApiProperty()
  current: number;

  @ApiProperty()
  previous: number;

  @ApiProperty()
  deltaPercent: number;
}

class DashboardKpisDto {
  @ApiProperty({ type: DashboardKpiItemDto })
  profit: DashboardKpiItemDto;

  @ApiProperty({ type: DashboardKpiItemDto })
  purchaseSpending: DashboardKpiItemDto;

  @ApiProperty({ type: DashboardKpiItemDto })
  repairSpending: DashboardKpiItemDto;

  @ApiProperty({ type: DashboardKpiItemDto })
  soldPhones: DashboardKpiItemDto;
}

class RevenuePointDto {
  @ApiProperty()
  name: string;

  @ApiProperty()
  revenue: number;
}

class DashboardRevenueSeriesDto {
  @ApiProperty({ type: [RevenuePointDto] })
  weekly: RevenuePointDto[];

  @ApiProperty({ type: [RevenuePointDto] })
  monthly: RevenuePointDto[];

  @ApiProperty({ type: [RevenuePointDto] })
  yearly: RevenuePointDto[];
}

class DashboardRecentRowDto {
  @ApiProperty()
  phone: string;

  @ApiProperty()
  amount: number;

  @ApiProperty()
  status: string;
}

class DashboardCustomerBalanceRowDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiProperty()
  phone: string;

  @ApiProperty()
  amount: number;
}

class DashboardPaidVsUnpaidDto {
  @ApiProperty()
  debt: number;

  @ApiProperty()
  credit: number;
}

export class DashboardOverviewDto {
  @ApiProperty({ type: DashboardKpisDto })
  kpis: DashboardKpisDto;

  @ApiProperty({ type: DashboardPaidVsUnpaidDto })
  paidVsUnpaid: DashboardPaidVsUnpaidDto;

  @ApiProperty({ type: DashboardRevenueSeriesDto })
  salesRevenue: DashboardRevenueSeriesDto;

  @ApiProperty({ type: [DashboardCustomerBalanceRowDto] })
  topDebtCustomers: DashboardCustomerBalanceRowDto[];

  @ApiProperty({ type: [DashboardCustomerBalanceRowDto] })
  topCreditCustomers: DashboardCustomerBalanceRowDto[];

  @ApiProperty({ type: [DashboardRecentRowDto] })
  recentSales: DashboardRecentRowDto[];

  @ApiProperty({ type: [DashboardRecentRowDto] })
  recentPurchases: DashboardRecentRowDto[];
}
