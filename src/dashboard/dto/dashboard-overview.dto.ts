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
  daily: RevenuePointDto[];

  @ApiProperty({ type: [RevenuePointDto] })
  weekly: RevenuePointDto[];

  @ApiProperty({ type: [RevenuePointDto] })
  monthly: RevenuePointDto[];

  @ApiProperty({ type: [RevenuePointDto] })
  threeMonths: RevenuePointDto[];

  @ApiProperty({ type: [RevenuePointDto] })
  sixMonths: RevenuePointDto[];

  @ApiProperty({ type: [RevenuePointDto] })
  custom: RevenuePointDto[];
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

class DashboardSalarySummaryDto {
  @ApiProperty()
  paid: number;

  @ApiProperty()
  remaining: number;
}

class DashboardPhoneSummaryDto {
  @ApiProperty()
  sold: number;

  @ApiProperty()
  purchased: number;
}

class DashboardInventorySummaryDto {
  @ApiProperty()
  count: number;

  @ApiProperty()
  totalPrice: number;
}

class DashboardWorkerSummaryDto {
  @ApiProperty()
  count: number;
}

export class DashboardOverviewDto {
  @ApiProperty({ type: DashboardKpisDto })
  kpis: DashboardKpisDto;

  @ApiProperty({ type: DashboardPaidVsUnpaidDto })
  paidVsUnpaid: DashboardPaidVsUnpaidDto;

  @ApiProperty({ type: DashboardSalarySummaryDto })
  salarySummary: DashboardSalarySummaryDto;

  @ApiProperty({ type: DashboardPhoneSummaryDto })
  phoneSummary: DashboardPhoneSummaryDto;

  @ApiProperty({ type: DashboardInventorySummaryDto })
  inventorySummary: DashboardInventorySummaryDto;

  @ApiProperty({ type: DashboardWorkerSummaryDto })
  workerSummary: DashboardWorkerSummaryDto;

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
