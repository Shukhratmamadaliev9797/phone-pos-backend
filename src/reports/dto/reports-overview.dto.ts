import { ApiProperty } from '@nestjs/swagger';

class RevenuePointDto {
  @ApiProperty()
  label: string;

  @ApiProperty()
  value: number;
}

class SimpleCustomerDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiProperty()
  phone: string;

  @ApiProperty()
  amount: number;

  @ApiProperty()
  last: string;
}

class WorkerPaymentRowDto {
  @ApiProperty()
  month: string;

  @ApiProperty()
  worker: string;

  @ApiProperty()
  salary: number;

  @ApiProperty()
  paid: number;

  @ApiProperty()
  lastPaid: string;
}

export class ReportsOverviewDto {
  @ApiProperty()
  salesRevenue: number;

  @ApiProperty()
  profit: number;

  @ApiProperty()
  purchaseSpending: number;

  @ApiProperty()
  repairSpending: number;

  @ApiProperty()
  unpaidSalesDebt: number;

  @ApiProperty()
  unpaidPurchasesCredit: number;

  @ApiProperty({ type: [RevenuePointDto] })
  salesRevenueSeries: RevenuePointDto[];

  @ApiProperty()
  salesPhonesSold: number;

  @ApiProperty()
  salesAvgPrice: number;

  @ApiProperty()
  salesPaidNowTotal: number;

  @ApiProperty()
  salesRemainingDebt: number;

  @ApiProperty({ type: [RevenuePointDto] })
  purchasesSpendingSeries: RevenuePointDto[];

  @ApiProperty()
  purchasesPhonesBought: number;

  @ApiProperty()
  purchasesAvgCost: number;

  @ApiProperty()
  purchasesPaidNowTotal: number;

  @ApiProperty()
  purchasesRemainingCredit: number;

  @ApiProperty({ type: [RevenuePointDto] })
  repairsSpendingSeries: RevenuePointDto[];

  @ApiProperty()
  repairsCount: number;

  @ApiProperty()
  repairsTotalSpending: number;

  @ApiProperty()
  repairsPending: number;

  @ApiProperty()
  repairsAvgCost: number;

  @ApiProperty()
  repairsTopTechnician: string;

  @ApiProperty({ type: [SimpleCustomerDto] })
  debtCustomers: SimpleCustomerDto[];

  @ApiProperty({ type: [SimpleCustomerDto] })
  creditCustomers: SimpleCustomerDto[];

  @ApiProperty()
  workersCount: number;

  @ApiProperty()
  workersTotalSalaryPaid: number;

  @ApiProperty()
  workersPendingPayments: number;

  @ApiProperty({ type: [WorkerPaymentRowDto] })
  workerPayments: WorkerPaymentRowDto[];
}
