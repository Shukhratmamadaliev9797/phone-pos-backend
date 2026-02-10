import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { ReportsOverviewDto } from '../dto/reports-overview.dto';

type ValueRow = { value: string | null };
type SeriesRow = { label: string; value: string };

@Injectable()
export class ReportsOverviewService {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async execute(): Promise<ReportsOverviewDto> {
    const [
      salesRevenue,
      purchaseSpending,
      repairSpending,
      unpaidSalesDebt,
      unpaidPurchasesCredit,
      salesSeries,
      purchasesSeries,
      repairsSeries,
      salesStats,
      purchasesStats,
      repairsStats,
      debtCustomers,
      creditCustomers,
      workersSummary,
      workerPayments,
    ] = await Promise.all([
      this.sumTotal('sales', 'totalPrice'),
      this.sumTotal('purchases', 'totalPrice'),
      this.sumTotal('repairs', 'costTotal'),
      this.sumOutstanding('sales'),
      this.sumOutstanding('purchases'),
      this.salesRevenueSeries(),
      this.purchasesSpendingSeries(),
      this.repairsSpendingSeries(),
      this.salesStats(),
      this.purchasesStats(),
      this.repairsStats(),
      this.topDebts(),
      this.topCredits(),
      this.workersSummary(),
      this.workerPayments(),
    ]);

    const salesRevenueNumber = Number(salesRevenue ?? 0);
    const purchaseSpendingNumber = Number(purchaseSpending ?? 0);
    const repairSpendingNumber = Number(repairSpending ?? 0);

    return {
      salesRevenue: salesRevenueNumber,
      profit: salesRevenueNumber - purchaseSpendingNumber - repairSpendingNumber,
      purchaseSpending: purchaseSpendingNumber,
      repairSpending: repairSpendingNumber,
      unpaidSalesDebt: Number(unpaidSalesDebt ?? 0),
      unpaidPurchasesCredit: Number(unpaidPurchasesCredit ?? 0),
      salesRevenueSeries: salesSeries.map((row) => ({
        label: row.label,
        value: Number(row.value),
      })),
      salesPhonesSold: Number((salesStats[0] as any)?.phonesSold ?? 0),
      salesAvgPrice: Number((salesStats[0] as any)?.avgPrice ?? 0),
      salesPaidNowTotal: Number((salesStats[0] as any)?.paidNowTotal ?? 0),
      salesRemainingDebt: Number((salesStats[0] as any)?.remainingTotal ?? 0),
      purchasesSpendingSeries: purchasesSeries.map((row) => ({
        label: row.label,
        value: Number(row.value),
      })),
      purchasesPhonesBought: Number((purchasesStats[0] as any)?.phonesBought ?? 0),
      purchasesAvgCost: Number((purchasesStats[0] as any)?.avgCost ?? 0),
      purchasesPaidNowTotal: Number((purchasesStats[0] as any)?.paidNowTotal ?? 0),
      purchasesRemainingCredit: Number(
        (purchasesStats[0] as any)?.remainingTotal ?? 0,
      ),
      repairsSpendingSeries: repairsSeries.map((row) => ({
        label: row.label,
        value: Number(row.value),
      })),
      repairsCount: Number((repairsStats[0] as any)?.repairsCount ?? 0),
      repairsTotalSpending: Number((repairsStats[0] as any)?.totalSpending ?? 0),
      repairsPending: Number((repairsStats[0] as any)?.pendingCount ?? 0),
      repairsAvgCost: Number((repairsStats[0] as any)?.avgCost ?? 0),
      repairsTopTechnician: (repairsStats[0] as any)?.topTechnician ?? 'N/A',
      debtCustomers: debtCustomers.map((row: any) => ({
        id: Number(row.id),
        name: row.name ?? 'Unknown',
        phone: row.phone,
        amount: Number(row.amount),
        last: row.last ? new Date(row.last).toISOString().slice(0, 10) : '—',
      })),
      creditCustomers: creditCustomers.map((row: any) => ({
        id: Number(row.id),
        name: row.name ?? 'Unknown',
        phone: row.phone,
        amount: Number(row.amount),
        last: row.last ? new Date(row.last).toISOString().slice(0, 10) : '—',
      })),
      workersCount: Number((workersSummary[0] as any)?.workersCount ?? 0),
      workersTotalSalaryPaid: Number(
        (workersSummary[0] as any)?.totalSalaryPaid ?? 0,
      ),
      workersPendingPayments: Number(
        (workersSummary[0] as any)?.pendingPayments ?? 0,
      ),
      workerPayments: workerPayments.map((row: any) => ({
        month: row.month,
        worker: row.worker,
        salary: Number(row.salary ?? 0),
        paid: Number(row.paid ?? 0),
        lastPaid: row.lastPaid ? new Date(row.lastPaid).toISOString().slice(0, 10) : '—',
      })),
    };
  }

  private async sumTotal(
    table: 'sales' | 'purchases' | 'repairs',
    column: 'totalPrice' | 'costTotal',
  ): Promise<number> {
    const rows = await this.dataSource.query(
      `SELECT COALESCE(SUM("${column}"), 0) AS value
       FROM "${table}"
       WHERE "isActive" = true`,
    );
    return Number((rows[0] as ValueRow)?.value ?? 0);
  }

  private async sumOutstanding(table: 'sales' | 'purchases'): Promise<number> {
    const rows = await this.dataSource.query(
      `SELECT COALESCE(SUM("remaining"), 0) AS value
       FROM "${table}"
       WHERE "isActive" = true AND "remaining" > 0`,
    );
    return Number((rows[0] as ValueRow)?.value ?? 0);
  }

  private salesRevenueSeries(): Promise<SeriesRow[]> {
    return this.dataSource.query(
      `SELECT 'W' || EXTRACT(WEEK FROM DATE_TRUNC('week', s."soldAt"))::text AS label,
              COALESCE(SUM(s."totalPrice"), 0) AS value
       FROM "sales" s
       WHERE s."isActive" = true
         AND s."soldAt" >= DATE_TRUNC('month', NOW())
       GROUP BY DATE_TRUNC('week', s."soldAt")
       ORDER BY DATE_TRUNC('week', s."soldAt") ASC`,
    );
  }

  private purchasesSpendingSeries(): Promise<SeriesRow[]> {
    return this.dataSource.query(
      `SELECT 'W' || EXTRACT(WEEK FROM DATE_TRUNC('week', p."purchasedAt"))::text AS label,
              COALESCE(SUM(p."totalPrice"), 0) AS value
       FROM "purchases" p
       WHERE p."isActive" = true
         AND p."purchasedAt" >= DATE_TRUNC('month', NOW())
       GROUP BY DATE_TRUNC('week', p."purchasedAt")
       ORDER BY DATE_TRUNC('week', p."purchasedAt") ASC`,
    );
  }

  private repairsSpendingSeries(): Promise<SeriesRow[]> {
    return this.dataSource.query(
      `SELECT 'W' || EXTRACT(WEEK FROM DATE_TRUNC('week', r."repairedAt"))::text AS label,
              COALESCE(SUM(r."costTotal"), 0) AS value
       FROM "repairs" r
       WHERE r."isActive" = true
         AND r."repairedAt" >= DATE_TRUNC('month', NOW())
       GROUP BY DATE_TRUNC('week', r."repairedAt")
       ORDER BY DATE_TRUNC('week', r."repairedAt") ASC`,
    );
  }

  private salesStats() {
    return this.dataSource.query(
      `SELECT
          COALESCE(COUNT(si."id"), 0) AS "phonesSold",
          COALESCE(AVG(s."totalPrice"), 0) AS "avgPrice",
          COALESCE(SUM(s."paidNow"), 0) AS "paidNowTotal",
          COALESCE(SUM(s."remaining"), 0) AS "remainingTotal"
       FROM "sales" s
       LEFT JOIN "sale_items" si ON si."saleId" = s."id" AND si."isActive" = true
       WHERE s."isActive" = true`,
    );
  }

  private purchasesStats() {
    return this.dataSource.query(
      `SELECT
          COALESCE(COUNT(pi."id"), 0) AS "phonesBought",
          COALESCE(AVG(p."totalPrice"), 0) AS "avgCost",
          COALESCE(SUM(p."paidNow"), 0) AS "paidNowTotal",
          COALESCE(SUM(p."remaining"), 0) AS "remainingTotal"
       FROM "purchases" p
       LEFT JOIN "purchase_items" pi ON pi."purchaseId" = p."id" AND pi."isActive" = true
       WHERE p."isActive" = true`,
    );
  }

  private repairsStats() {
    return this.dataSource.query(
      `WITH top_technician AS (
         SELECT COALESCE(u."fullName", u."username", 'N/A') AS name
         FROM "repairs" r
         LEFT JOIN "users" u ON u."id" = r."technicianId"
         WHERE r."isActive" = true
         GROUP BY r."technicianId", u."fullName", u."username"
         ORDER BY COUNT(*) DESC
         LIMIT 1
       )
       SELECT
         COALESCE(COUNT(r."id"), 0) AS "repairsCount",
         COALESCE(SUM(r."costTotal"), 0) AS "totalSpending",
         COALESCE(SUM(CASE WHEN r."status" = 'PENDING' THEN 1 ELSE 0 END), 0) AS "pendingCount",
         COALESCE(AVG(r."costTotal"), 0) AS "avgCost",
         COALESCE((SELECT name FROM top_technician LIMIT 1), 'N/A') AS "topTechnician"
       FROM "repairs" r
       WHERE r."isActive" = true`,
    );
  }

  private topDebts() {
    return this.dataSource.query(
      `SELECT
          c."id" AS id,
          c."fullName" AS name,
          c."phoneNumber" AS phone,
          COALESCE(SUM(s."remaining"), 0) AS amount,
          MAX(s."soldAt") AS last
       FROM "customers" c
       INNER JOIN "sales" s ON s."customerId" = c."id"
       WHERE c."isActive" = true AND s."isActive" = true AND s."remaining" > 0
       GROUP BY c."id", c."fullName", c."phoneNumber"
       ORDER BY amount DESC
       LIMIT 5`,
    );
  }

  private topCredits() {
    return this.dataSource.query(
      `SELECT
          c."id" AS id,
          c."fullName" AS name,
          c."phoneNumber" AS phone,
          COALESCE(SUM(p."remaining"), 0) AS amount,
          MAX(p."purchasedAt") AS last
       FROM "customers" c
       INNER JOIN "purchases" p ON p."customerId" = c."id"
       WHERE c."isActive" = true AND p."isActive" = true AND p."remaining" > 0
       GROUP BY c."id", c."fullName", c."phoneNumber"
       ORDER BY amount DESC
       LIMIT 5`,
    );
  }

  private workersSummary() {
    const month = new Date();
    const monthKey = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}`;
    return this.dataSource.query(
      `SELECT
         COALESCE(COUNT(w."id"), 0) AS "workersCount",
         COALESCE(SUM(sp."amountPaid"), 0) AS "totalSalaryPaid",
         COALESCE(SUM(w."monthlySalary"), 0) - COALESCE(SUM(sp."amountPaid"), 0) AS "pendingPayments"
       FROM "workers" w
       LEFT JOIN "worker_salary_payments" sp
         ON sp."workerId" = w."id" AND sp."isActive" = true AND sp."month" = $1
       WHERE w."isActive" = true`,
      [monthKey],
    );
  }

  private workerPayments() {
    const month = new Date();
    const monthKey = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}`;
    return this.dataSource.query(
      `SELECT
         $1 AS month,
         CONCAT(w."fullName", ' (', w."workerRole", ')') AS worker,
         w."monthlySalary" AS salary,
         COALESCE(SUM(sp."amountPaid"), 0) AS paid,
         MAX(sp."paidAt") AS "lastPaid"
       FROM "workers" w
       LEFT JOIN "worker_salary_payments" sp
         ON sp."workerId" = w."id" AND sp."isActive" = true AND sp."month" = $1
       WHERE w."isActive" = true
       GROUP BY w."id", w."fullName", w."workerRole", w."monthlySalary"
       ORDER BY w."id" DESC
       LIMIT 10`,
      [monthKey],
    );
  }
}
