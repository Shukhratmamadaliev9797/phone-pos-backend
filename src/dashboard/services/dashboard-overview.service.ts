import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { DashboardOverviewDto } from '../dto/dashboard-overview.dto';

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
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async execute(): Promise<DashboardOverviewDto> {
    const now = new Date();
    const currentMonthStart = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
    );
    const previousMonthStart = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1),
    );

    const [
      salesCurrent,
      salesPrevious,
      purchasesCurrent,
      purchasesPrevious,
      repairsCurrent,
      repairsPrevious,
      soldCurrent,
      soldPrevious,
      debtTotal,
      creditTotal,
      weeklyRevenue,
      monthlyRevenue,
      yearlyRevenue,
      topDebtCustomers,
      topCreditCustomers,
      recentSales,
      recentPurchases,
    ] = await Promise.all([
      this.sumByPeriod('sales', 'soldAt', currentMonthStart, now),
      this.sumByPeriod('sales', 'soldAt', previousMonthStart, currentMonthStart),
      this.sumByPeriod('purchases', 'purchasedAt', currentMonthStart, now),
      this.sumByPeriod(
        'purchases',
        'purchasedAt',
        previousMonthStart,
        currentMonthStart,
      ),
      this.sumByPeriod('repairs', 'repairedAt', currentMonthStart, now),
      this.sumByPeriod(
        'repairs',
        'repairedAt',
        previousMonthStart,
        currentMonthStart,
      ),
      this.countSoldByPeriod(currentMonthStart, now),
      this.countSoldByPeriod(previousMonthStart, currentMonthStart),
      this.sumOutstanding('sales'),
      this.sumOutstanding('purchases'),
      this.revenueWeeklySeries(),
      this.revenueMonthlySeries(),
      this.revenueYearlySeries(),
      this.fetchTopDebts(),
      this.fetchTopCredits(),
      this.fetchRecentSales(),
      this.fetchRecentPurchases(),
    ]);

    const salesCurrentNumber = Number(salesCurrent ?? 0);
    const salesPreviousNumber = Number(salesPrevious ?? 0);
    const purchasesCurrentNumber = Number(purchasesCurrent ?? 0);
    const purchasesPreviousNumber = Number(purchasesPrevious ?? 0);
    const repairsCurrentNumber = Number(repairsCurrent ?? 0);
    const repairsPreviousNumber = Number(repairsPrevious ?? 0);
    const soldCurrentNumber = Number(soldCurrent ?? 0);
    const soldPreviousNumber = Number(soldPrevious ?? 0);

    const profitCurrent =
      salesCurrentNumber - purchasesCurrentNumber - repairsCurrentNumber;
    const profitPrevious =
      salesPreviousNumber - purchasesPreviousNumber - repairsPreviousNumber;

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
      salesRevenue: {
        weekly: weeklyRevenue.map((row) => ({
          name: row.label,
          revenue: Number(row.revenue),
        })),
        monthly: monthlyRevenue.map((row) => ({
          name: row.label,
          revenue: Number(row.revenue),
        })),
        yearly: yearlyRevenue.map((row) => ({
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

  private async sumOutstanding(
    table: 'sales' | 'purchases',
  ): Promise<number> {
    const rows = await this.dataSource.query(
      `SELECT COALESCE(SUM("remaining"), 0) AS value
       FROM "${table}"
       WHERE "isActive" = true
         AND "remaining" > 0`,
    );
    return Number((rows[0] as NumericRow)?.value ?? 0);
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
      `SELECT TO_CHAR(DATE_TRUNC('month', s."soldAt"), 'Mon') AS label,
              COALESCE(SUM(s."totalPrice"), 0) AS revenue
       FROM "sales" s
       WHERE s."isActive" = true
         AND s."soldAt" >= DATE_TRUNC('month', NOW()) - INTERVAL '11 month'
       GROUP BY DATE_TRUNC('month', s."soldAt")
       ORDER BY DATE_TRUNC('month', s."soldAt") ASC`,
    );
  }

  private async revenueYearlySeries(): Promise<SeriesRow[]> {
    return this.dataSource.query(
      `SELECT TO_CHAR(DATE_TRUNC('year', s."soldAt"), 'YYYY') AS label,
              COALESCE(SUM(s."totalPrice"), 0) AS revenue
       FROM "sales" s
       WHERE s."isActive" = true
         AND s."soldAt" >= DATE_TRUNC('year', NOW()) - INTERVAL '4 year'
       GROUP BY DATE_TRUNC('year', s."soldAt")
       ORDER BY DATE_TRUNC('year', s."soldAt") ASC`,
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
