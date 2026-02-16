import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { DashboardOverviewDto } from '../dto/dashboard-overview.dto';

export type DashboardKpiPeriod = 'daily' | 'weekly' | 'monthly' | 'custom';

type NumericRow = {
  value: string | null;
};

type SeriesRow = {
  label: string;
  revenue: string;
};

type RecentRow = {
  phone: string | null;
  amount: string;
  status: string;
};

type CustomerBalanceRow = {
  id: string;
  name: string | null;
  phone: string;
  amount: string;
};

@Injectable()
export class DashboardOverviewService {
  private readonly logger = new Logger(DashboardOverviewService.name);

  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async execute(
    kpiPeriod: DashboardKpiPeriod = 'monthly',
    customFrom?: string,
    customTo?: string,
  ): Promise<DashboardOverviewDto> {
    const now = new Date();
    const { currentFrom, currentTo, previousFrom, previousTo } =
      this.resolveKpiRange(kpiPeriod, now, customFrom, customTo);

    const [
      profitCurrentRaw,
      purchaseCurrentRaw,
      repairCurrentRaw,
      salesRevenueCurrentRaw,
      salaryPaidCurrentRaw,
      profitPreviousRaw,
      salaryPaidPreviousRaw,
      purchasePreviousRaw,
      repairPreviousRaw,
      salesRevenuePreviousRaw,
      monthlySalaryTotalRaw,
      monthlyPaidThisMonthRaw,
      percentSalaryRemainingRaw,
      soldPhonesCountRaw,
      purchasedPhonesCountRaw,
      inventoryCountRaw,
      inventoryTotalPriceRaw,
      workersCountRaw,
      debtTotal,
      creditTotal,
      dailyRevenue,
      weeklyRevenue,
      monthlyRevenue,
      threeMonthsRevenue,
      sixMonthsRevenue,
      customRevenue,
      topDebtCustomers,
      topCreditCustomers,
      recentSales,
      recentPurchases,
    ] = await Promise.all([
      this.safe(() => this.sumSaleProfitByPeriod(currentFrom, currentTo), 0, 'sumSaleProfitByPeriod(current)'),
      this.safe(() => this.sumPurchasedInventoryPriceByPeriod(currentFrom, currentTo), 0, 'sumPurchasedInventoryPriceByPeriod(current)'),
      this.safe(() => this.sumRepairCostByPeriod(currentFrom, currentTo), 0, 'sumRepairCostByPeriod(current)'),
      this.safe(() => this.sumSalesRevenueByPeriod(currentFrom, currentTo), 0, 'sumSalesRevenueByPeriod(current)'),
      this.safe(() => this.sumSalaryPaymentsByPeriod(currentFrom, currentTo), 0, 'sumSalaryPaymentsByPeriod(current)'),
      this.safe(() => this.sumSaleProfitByPeriod(previousFrom, previousTo), 0, 'sumSaleProfitByPeriod(previous)'),
      this.safe(() => this.sumSalaryPaymentsByPeriod(previousFrom, previousTo), 0, 'sumSalaryPaymentsByPeriod(previous)'),
      this.safe(() => this.sumPurchasedInventoryPriceByPeriod(previousFrom, previousTo), 0, 'sumPurchasedInventoryPriceByPeriod(previous)'),
      this.safe(() => this.sumRepairCostByPeriod(previousFrom, previousTo), 0, 'sumRepairCostByPeriod(previous)'),
      this.safe(() => this.sumSalesRevenueByPeriod(previousFrom, previousTo), 0, 'sumSalesRevenueByPeriod(previous)'),
      this.safe(() => this.sumMonthlySalaryTotal(), 0, 'sumMonthlySalaryTotal'),
      this.safe(() => this.sumMonthlySalaryPaidThisMonth(), 0, 'sumMonthlySalaryPaidThisMonth'),
      this.safe(() => this.sumPercentSalaryRemaining(), 0, 'sumPercentSalaryRemaining'),
      this.safe(() => this.countSoldByPeriod(currentFrom, currentTo), 0, 'countSoldByPeriod'),
      this.safe(() => this.countPurchasedByPeriod(currentFrom, currentTo), 0, 'countPurchasedByPeriod'),
      this.safe(() => this.countInventoryItems(), 0, 'countInventoryItems'),
      this.safe(() => this.sumInventoryTotalPrice(), 0, 'sumInventoryTotalPrice'),
      this.safe(() => this.countWorkersByPeriod(currentFrom, currentTo), 0, 'countWorkersByPeriod'),
      this.safe(() => this.sumOutstandingSalesByPeriod(currentFrom, currentTo), 0, 'sumOutstandingSalesByPeriod'),
      this.safe(() => this.sumOutstandingPurchasesByPeriod(currentFrom, currentTo), 0, 'sumOutstandingPurchasesByPeriod'),
      this.safe(() => this.revenueDailySeries(), [] as SeriesRow[], 'revenueDailySeries'),
      this.safe(() => this.revenueWeeklySeries(), [] as SeriesRow[], 'revenueWeeklySeries'),
      this.safe(() => this.revenueMonthlySeries(), [] as SeriesRow[], 'revenueMonthlySeries'),
      this.safe(() => this.revenueThreeMonthsSeries(), [] as SeriesRow[], 'revenueThreeMonthsSeries'),
      this.safe(() => this.revenueSixMonthsSeries(), [] as SeriesRow[], 'revenueSixMonthsSeries'),
      this.safe(() => this.revenueCustomSeries(currentFrom, currentTo), [] as SeriesRow[], 'revenueCustomSeries'),
      this.safe(() => this.fetchTopDebts(), [] as CustomerBalanceRow[], 'fetchTopDebts'),
      this.safe(() => this.fetchTopCredits(), [] as CustomerBalanceRow[], 'fetchTopCredits'),
      this.safe(() => this.fetchRecentSales(), [] as RecentRow[], 'fetchRecentSales'),
      this.safe(() => this.fetchRecentPurchases(), [] as RecentRow[], 'fetchRecentPurchases'),
    ]);

    const purchasesCurrentNumber = Number(purchaseCurrentRaw ?? 0);
    const purchasesPreviousNumber = Number(purchasePreviousRaw ?? 0);
    const repairsCurrentNumber = Number(repairCurrentRaw ?? 0);
    const repairsPreviousNumber = Number(repairPreviousRaw ?? 0);
    const soldCurrentNumber = Number(salesRevenueCurrentRaw ?? 0);
    const soldPreviousNumber = Number(salesRevenuePreviousRaw ?? 0);
    const monthlySalaryTotal = Number(monthlySalaryTotalRaw ?? 0);
    const monthlyPaidThisMonth = Number(monthlyPaidThisMonthRaw ?? 0);
    const percentSalaryRemaining = Number(percentSalaryRemainingRaw ?? 0);
    const monthlyRemaining = Math.max(0, monthlySalaryTotal - monthlyPaidThisMonth);
    const totalSalaryRemaining = monthlyRemaining + percentSalaryRemaining;
    const salaryPaidTotal = Number(salaryPaidCurrentRaw ?? 0);
    const soldPhonesCount = Number(soldPhonesCountRaw ?? 0);
    const purchasedPhonesCount = Number(purchasedPhonesCountRaw ?? 0);
    const inventoryCount = Number(inventoryCountRaw ?? 0);
    const inventoryTotalPrice = Number(inventoryTotalPriceRaw ?? 0);
    const workersCount = Number(workersCountRaw ?? 0);

    const profitCurrent =
      Number(profitCurrentRaw ?? 0) - Number(salaryPaidCurrentRaw ?? 0);
    const profitPrevious =
      Number(profitPreviousRaw ?? 0) - Number(salaryPaidPreviousRaw ?? 0);

    return {
      kpis: {
        profit: this.kpi(profitCurrent, profitPrevious),
        purchaseSpending: this.kpi(
          purchasesCurrentNumber,
          purchasesPreviousNumber,
        ),
        repairSpending: this.kpi(repairsCurrentNumber, repairsPreviousNumber),
        soldPhones: this.kpi(soldCurrentNumber, soldPreviousNumber),
      },
      paidVsUnpaid: {
        debt: Number(debtTotal ?? 0),
        credit: Number(creditTotal ?? 0),
      },
      salarySummary: {
        paid: salaryPaidTotal,
        remaining: totalSalaryRemaining,
      },
      phoneSummary: {
        sold: soldPhonesCount,
        purchased: purchasedPhonesCount,
      },
      inventorySummary: {
        count: inventoryCount,
        totalPrice: inventoryTotalPrice,
      },
      workerSummary: {
        count: workersCount,
      },
      salesRevenue: {
        daily: dailyRevenue.map((row) => ({
          name: row.label,
          revenue: Number(row.revenue),
        })),
        weekly: weeklyRevenue.map((row) => ({
          name: row.label,
          revenue: Number(row.revenue),
        })),
        monthly: monthlyRevenue.map((row) => ({
          name: row.label,
          revenue: Number(row.revenue),
        })),
        threeMonths: threeMonthsRevenue.map((row) => ({
          name: row.label,
          revenue: Number(row.revenue),
        })),
        sixMonths: sixMonthsRevenue.map((row) => ({
          name: row.label,
          revenue: Number(row.revenue),
        })),
        custom: customRevenue.map((row) => ({
          name: row.label,
          revenue: Number(row.revenue),
        })),
      },
      topDebtCustomers: topDebtCustomers.map((row) => ({
        id: Number(row.id),
        name: row.name ?? 'Unknown',
        phone: row.phone,
        amount: Number(row.amount),
      })),
      topCreditCustomers: topCreditCustomers.map((row) => ({
        id: Number(row.id),
        name: row.name ?? 'Unknown',
        phone: row.phone,
        amount: Number(row.amount),
      })),
      recentSales: recentSales.map((row) => ({
        phone: row.phone ?? 'Phone',
        amount: Number(row.amount),
        status: row.status,
      })),
      recentPurchases: recentPurchases.map((row) => ({
        phone: row.phone ?? 'Phone',
        amount: Number(row.amount),
        status: row.status,
      })),
    };
  }

  private kpi(current: number, previous: number) {
    return {
      current,
      previous,
      deltaPercent: this.deltaPercent(current, previous),
    };
  }

  private deltaPercent(current: number, previous: number): number {
    if (previous === 0) {
      return current === 0 ? 0 : 100;
    }
    return Number((((current - previous) / Math.abs(previous)) * 100).toFixed(2));
  }

  private async safe<T>(
    run: () => Promise<T>,
    fallback: T,
    label: string,
  ): Promise<T> {
    try {
      return await run();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown dashboard query error';
      this.logger.error(`${label} failed: ${message}`);
      return fallback;
    }
  }

  private async sumByPeriod(
    table: 'sales' | 'purchases' | 'repairs',
    dateColumn: 'soldAt' | 'purchasedAt' | 'repairedAt',
    from: Date,
    to: Date,
  ): Promise<number> {
    if (table === 'repairs') {
      const repairRow = await this.dataSource.query(
        `SELECT COALESCE(SUM("costTotal"), 0) AS value
         FROM "repairs"
         WHERE "isActive" = true
           AND "repairedAt" >= $1
           AND "repairedAt" < $2`,
        [from.toISOString(), to.toISOString()],
      );
      return Number((repairRow[0] as NumericRow)?.value ?? 0);
    }

    const row = await this.dataSource.query(
      `SELECT COALESCE(SUM("totalPrice"), 0) AS value
       FROM "${table}"
       WHERE "isActive" = true
         AND "${dateColumn}" >= $1
         AND "${dateColumn}" < $2`,
      [from.toISOString(), to.toISOString()],
    );

    return Number((row[0] as NumericRow)?.value ?? 0);
  }

  private async sumSaleProfitByPeriod(from: Date, to: Date): Promise<number> {
    const rows = await this.dataSource.query(
      `SELECT COALESCE(SUM("profit"), 0) AS value
       FROM "sales"
       WHERE "isActive" = true
         AND "soldAt" >= $1
         AND "soldAt" < $2`,
      [from.toISOString(), to.toISOString()],
    );
    return Number((rows[0] as NumericRow)?.value ?? 0);
  }

  private async sumPurchasedInventoryPriceByPeriod(
    from: Date,
    to: Date,
  ): Promise<number> {
    const rows = await this.dataSource.query(
      `SELECT COALESCE(SUM(ii."expectedSalePrice"), 0) AS value
       FROM "inventory_items" ii
       WHERE ii."isActive" = true
         AND ii."purchaseId" IS NOT NULL
         AND ii."createdAt" >= $1
         AND ii."createdAt" < $2`,
      [from.toISOString(), to.toISOString()],
    );
    return Number((rows[0] as NumericRow)?.value ?? 0);
  }

  private async sumRepairCostByPeriod(from: Date, to: Date): Promise<number> {
    const rows = await this.dataSource.query(
      `SELECT COALESCE(SUM("costTotal"), 0) AS value
       FROM "repairs" r
       INNER JOIN "inventory_items" ii ON ii."id" = r."itemId"
       WHERE r."isActive" = true
         AND ii."isActive" = true
         AND r."repairedAt" >= $1
         AND r."repairedAt" < $2`,
      [from.toISOString(), to.toISOString()],
    );
    return Number((rows[0] as NumericRow)?.value ?? 0);
  }

  private async sumSalesRevenueByPeriod(from: Date, to: Date): Promise<number> {
    const rows = await this.dataSource.query(
      `SELECT COALESCE(SUM("totalPrice"), 0) AS value
       FROM "sales"
       WHERE "isActive" = true
         AND "soldAt" >= $1
         AND "soldAt" < $2`,
      [from.toISOString(), to.toISOString()],
    );
    return Number((rows[0] as NumericRow)?.value ?? 0);
  }

  private async sumSalaryPaymentsByPeriod(from: Date, to: Date): Promise<number> {
    const rows = await this.dataSource.query(
      `SELECT COALESCE(SUM("amountPaid"), 0) AS value
       FROM "worker_salary_payments"
       WHERE "isActive" = true
         AND "paidAt" >= $1
         AND "paidAt" < $2`,
      [from.toISOString(), to.toISOString()],
    );
    return Number((rows[0] as NumericRow)?.value ?? 0);
  }

  private async countSoldByPeriod(from: Date, to: Date): Promise<number> {
    const rows = await this.dataSource.query(
      `SELECT COUNT(*) AS value
       FROM "sale_items" si
       INNER JOIN "sales" s ON s."id" = si."saleId"
       WHERE si."isActive" = true
         AND s."isActive" = true
         AND s."soldAt" >= $1
         AND s."soldAt" < $2`,
      [from.toISOString(), to.toISOString()],
    );
    return Number((rows[0] as NumericRow)?.value ?? 0);
  }

  private async countPurchasedByPeriod(from: Date, to: Date): Promise<number> {
    const rows = await this.dataSource.query(
      `SELECT COUNT(*) AS value
       FROM "inventory_items" ii
       WHERE ii."isActive" = true
         AND ii."purchaseId" IS NOT NULL
         AND ii."createdAt" >= $1
         AND ii."createdAt" < $2`,
      [from.toISOString(), to.toISOString()],
    );
    return Number((rows[0] as NumericRow)?.value ?? 0);
  }

  private async countInventoryItems(): Promise<number> {
    const rows = await this.dataSource.query(
      `SELECT COUNT(*) AS value
       FROM "inventory_items"
       WHERE "isActive" = true`,
    );
    return Number((rows[0] as NumericRow)?.value ?? 0);
  }

  private async sumInventoryTotalPrice(): Promise<number> {
    const rows = await this.dataSource.query(
      `SELECT COALESCE(SUM("expectedSalePrice"), 0) AS value
       FROM "inventory_items"
       WHERE "isActive" = true`,
    );
    return Number((rows[0] as NumericRow)?.value ?? 0);
  }

  private async countWorkersByPeriod(from: Date, to: Date): Promise<number> {
    const rows = await this.dataSource.query(
      `SELECT COUNT(*) AS value
       FROM "workers"
       WHERE "deletedAt" IS NULL
         AND COALESCE("isActive", true) = true
         AND "createdAt" >= $1
         AND "createdAt" < $2`,
      [from.toISOString(), to.toISOString()],
    );
    return Number((rows[0] as NumericRow)?.value ?? 0);
  }

  private resolveKpiRange(
    period: DashboardKpiPeriod,
    now: Date,
    customFrom?: string,
    customTo?: string,
  ): {
    currentFrom: Date;
    currentTo: Date;
    previousFrom: Date;
    previousTo: Date;
  } {
    if (period === 'custom') {
      if (!customFrom || !customTo) {
        throw new BadRequestException('from and to are required for custom range');
      }

      const parsedFrom = new Date(customFrom);
      const parsedTo = new Date(customTo);

      if (
        Number.isNaN(parsedFrom.getTime()) ||
        Number.isNaN(parsedTo.getTime())
      ) {
        throw new BadRequestException('Invalid from/to date format');
      }

      const currentFrom = new Date(
        Date.UTC(
          parsedFrom.getUTCFullYear(),
          parsedFrom.getUTCMonth(),
          parsedFrom.getUTCDate(),
        ),
      );
      const currentTo = new Date(
        Date.UTC(
          parsedTo.getUTCFullYear(),
          parsedTo.getUTCMonth(),
          parsedTo.getUTCDate() + 1,
        ),
      );

      if (currentTo <= currentFrom) {
        throw new BadRequestException('to must be greater than or equal to from');
      }

      const windowMs = currentTo.getTime() - currentFrom.getTime();
      const previousTo = new Date(currentFrom);
      const previousFrom = new Date(currentFrom.getTime() - windowMs);

      return { currentFrom, currentTo, previousFrom, previousTo };
    }

    const currentTo = now;

    if (period === 'daily') {
      const currentFrom = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
      );
      const previousFrom = new Date(currentFrom);
      previousFrom.setUTCDate(previousFrom.getUTCDate() - 1);
      return { currentFrom, currentTo, previousFrom, previousTo: currentFrom };
    }

    if (period === 'weekly') {
      const currentFrom = new Date(currentTo);
      currentFrom.setUTCDate(currentFrom.getUTCDate() - 7);
      const previousFrom = new Date(currentFrom);
      previousFrom.setUTCDate(previousFrom.getUTCDate() - 7);
      return { currentFrom, currentTo, previousFrom, previousTo: currentFrom };
    }

    if (period === 'monthly') {
      const currentFrom = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
      );
      const previousFrom = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1),
      );
      return { currentFrom, currentTo, previousFrom, previousTo: currentFrom };
    }

    const currentFrom = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
    );
    const previousFrom = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1),
    );
    return { currentFrom, currentTo, previousFrom, previousTo: currentFrom };
  }

  private async sumOutstandingSalesByPeriod(
    from: Date,
    to: Date,
  ): Promise<number> {
    const rows = await this.dataSource.query(
      `SELECT COALESCE(SUM(s."remaining"), 0) AS value
       FROM "sales" s
       WHERE "isActive" = true
         AND s."paymentType" = 'PAY_LATER'
         AND s."remaining" > 0
         AND s."soldAt" >= $1
         AND s."soldAt" < $2`,
      [from.toISOString(), to.toISOString()],
    );
    return Number((rows[0] as NumericRow)?.value ?? 0);
  }

  private async sumOutstandingPurchasesByPeriod(
    from: Date,
    to: Date,
  ): Promise<number> {
    const rows = await this.dataSource.query(
      `SELECT COALESCE(SUM(p."remaining"), 0) AS value
       FROM "purchases" p
       WHERE p."isActive" = true
         AND p."paymentType" = 'PAY_LATER'
         AND p."remaining" > 0
         AND p."purchasedAt" >= $1
         AND p."purchasedAt" < $2
         AND EXISTS (
           SELECT 1
           FROM "inventory_items" ii
           WHERE ii."purchaseId" = p."id"
             AND ii."isActive" = true
         )`,
      [from.toISOString(), to.toISOString()],
    );
    return Number((rows[0] as NumericRow)?.value ?? 0);
  }

  private async sumMonthlySalaryTotal(): Promise<number> {
    const rows = await this.dataSource.query(
      `SELECT COALESCE(SUM("monthlySalary"), 0) AS value
       FROM "workers"
       WHERE "isActive" = true
         AND "salaryType" = 'MONTHLY'`,
    );
    return Number((rows[0] as NumericRow)?.value ?? 0);
  }

  private async sumMonthlySalaryPaidThisMonth(): Promise<number> {
    const rows = await this.dataSource.query(
      `SELECT COALESCE(SUM(wsp."amountPaid"), 0) AS value
       FROM "worker_salary_payments" wsp
       INNER JOIN "workers" w ON w."id" = wsp."workerId"
       WHERE wsp."isActive" = true
         AND w."isActive" = true
         AND w."salaryType" = 'MONTHLY'
         AND DATE_TRUNC('month', wsp."paidAt") = DATE_TRUNC('month', NOW())`,
    );
    return Number((rows[0] as NumericRow)?.value ?? 0);
  }

  private async sumPercentSalaryRemaining(): Promise<number> {
    const rows = await this.dataSource.query(
      `SELECT COALESCE(SUM("percentSalaryAccrued"), 0) AS value
       FROM "workers"
       WHERE "isActive" = true
         AND "salaryType" = 'PERCENT'`,
    );
    return Number((rows[0] as NumericRow)?.value ?? 0);
  }

  private async revenueDailySeries(): Promise<SeriesRow[]> {
    return this.dataSource.query(
      `SELECT TO_CHAR(DATE_TRUNC('hour', s."soldAt"), 'HH24:00') AS label,
              COALESCE(SUM(s."totalPrice"), 0) AS revenue
       FROM "sales" s
       WHERE s."isActive" = true
         AND s."soldAt" >= NOW() - INTERVAL '23 hour'
       GROUP BY DATE_TRUNC('hour', s."soldAt")
       ORDER BY DATE_TRUNC('hour', s."soldAt") ASC`,
    );
  }

  private async revenueWeeklySeries(): Promise<SeriesRow[]> {
    return this.dataSource.query(
      `SELECT TO_CHAR(DATE_TRUNC('day', s."soldAt"), 'Dy') AS label,
              COALESCE(SUM(s."totalPrice"), 0) AS revenue
       FROM "sales" s
       WHERE s."isActive" = true
         AND s."soldAt" >= NOW() - INTERVAL '6 day'
       GROUP BY DATE_TRUNC('day', s."soldAt")
       ORDER BY DATE_TRUNC('day', s."soldAt") ASC`,
    );
  }

  private async revenueMonthlySeries(): Promise<SeriesRow[]> {
    return this.dataSource.query(
      `SELECT TO_CHAR(DATE_TRUNC('day', s."soldAt"), 'DD Mon') AS label,
              COALESCE(SUM(s."totalPrice"), 0) AS revenue
       FROM "sales" s
       WHERE s."isActive" = true
         AND s."soldAt" >= DATE_TRUNC('month', NOW())
       GROUP BY DATE_TRUNC('day', s."soldAt")
       ORDER BY DATE_TRUNC('day', s."soldAt") ASC`,
    );
  }

  private async revenueThreeMonthsSeries(): Promise<SeriesRow[]> {
    return this.dataSource.query(
      `SELECT TO_CHAR(DATE_TRUNC('month', s."soldAt"), 'Mon') AS label,
              COALESCE(SUM(s."totalPrice"), 0) AS revenue
       FROM "sales" s
       WHERE s."isActive" = true
         AND s."soldAt" >= DATE_TRUNC('month', NOW()) - INTERVAL '2 month'
       GROUP BY DATE_TRUNC('month', s."soldAt")
       ORDER BY DATE_TRUNC('month', s."soldAt") ASC`,
    );
  }

  private async revenueSixMonthsSeries(): Promise<SeriesRow[]> {
    return this.dataSource.query(
      `SELECT TO_CHAR(DATE_TRUNC('month', s."soldAt"), 'Mon') AS label,
              COALESCE(SUM(s."totalPrice"), 0) AS revenue
       FROM "sales" s
       WHERE s."isActive" = true
         AND s."soldAt" >= DATE_TRUNC('month', NOW()) - INTERVAL '5 month'
       GROUP BY DATE_TRUNC('month', s."soldAt")
       ORDER BY DATE_TRUNC('month', s."soldAt") ASC`,
    );
  }

  private async revenueCustomSeries(from: Date, to: Date): Promise<SeriesRow[]> {
    return this.dataSource.query(
      `SELECT TO_CHAR(DATE_TRUNC('day', s."soldAt"), 'DD Mon') AS label,
              COALESCE(SUM(s."totalPrice"), 0) AS revenue
       FROM "sales" s
       WHERE s."isActive" = true
         AND s."soldAt" >= $1
         AND s."soldAt" < $2
       GROUP BY DATE_TRUNC('day', s."soldAt")
       ORDER BY DATE_TRUNC('day', s."soldAt") ASC`,
      [from.toISOString(), to.toISOString()],
    );
  }

  private async fetchTopDebts(): Promise<CustomerBalanceRow[]> {
    return this.dataSource.query(
      `SELECT c."id" as id,
              c."fullName" as name,
              c."phoneNumber" as phone,
              COALESCE(SUM(s."remaining"), 0) as amount
       FROM "customers" c
       INNER JOIN "sales" s ON s."customerId" = c."id"
       WHERE c."isActive" = true
         AND s."isActive" = true
         AND s."remaining" > 0
       GROUP BY c."id", c."fullName", c."phoneNumber"
       ORDER BY amount DESC
       LIMIT 5`,
    );
  }

  private async fetchTopCredits(): Promise<CustomerBalanceRow[]> {
    return this.dataSource.query(
      `SELECT c."id" as id,
              c."fullName" as name,
              c."phoneNumber" as phone,
              COALESCE(SUM(p."remaining"), 0) as amount
       FROM "customers" c
       INNER JOIN "purchases" p ON p."customerId" = c."id"
       WHERE c."isActive" = true
         AND p."isActive" = true
         AND p."remaining" > 0
       GROUP BY c."id", c."fullName", c."phoneNumber"
       ORDER BY amount DESC
       LIMIT 5`,
    );
  }

  private async fetchRecentSales(): Promise<RecentRow[]> {
    return this.dataSource.query(
      `SELECT CONCAT(ii."brand", ' ', ii."model") AS phone,
              s."totalPrice" AS amount,
              CASE
                WHEN s."remaining" <= 0 THEN 'Paid'
                ELSE 'Debt'
              END AS status
       FROM "sales" s
       LEFT JOIN "sale_items" si ON si."saleId" = s."id" AND si."isActive" = true
       LEFT JOIN "inventory_items" ii ON ii."id" = si."itemId"
       WHERE s."isActive" = true
       ORDER BY s."soldAt" DESC
       LIMIT 10`,
    );
  }

  private async fetchRecentPurchases(): Promise<RecentRow[]> {
    return this.dataSource.query(
      `SELECT CONCAT(ii."brand", ' ', ii."model") AS phone,
              p."totalPrice" AS amount,
              CASE
                WHEN p."remaining" <= 0 THEN 'Paid'
                ELSE 'Credit'
              END AS status
       FROM "purchases" p
       LEFT JOIN "purchase_items" pi ON pi."purchaseId" = p."id" AND pi."isActive" = true
       LEFT JOIN "inventory_items" ii ON ii."id" = pi."itemId"
       WHERE p."isActive" = true
       ORDER BY p."purchasedAt" DESC
       LIMIT 10`,
    );
  }
}
