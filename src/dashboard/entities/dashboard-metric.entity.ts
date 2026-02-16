import { Column, Entity } from 'typeorm';
import { Extender } from 'src/common/entities/common.entites';

export enum DashboardMetricType {
  PROFIT = 'PROFIT',
  PURCHASE_PRICE = 'PURCHASE_PRICE',
  SALE_PRICE = 'SALE_PRICE',
  SALE_REVENUE = 'SALE_REVENUE',
  REPAIR_PRICE = 'REPAIR_PRICE',
  SALARY_PAYMENT = 'SALARY_PAYMENT',
  WORKERS = 'WORKERS',
  SOLD_PHONES = 'SOLD_PHONES',
  PURCHASED_PHONES = 'PURCHASED_PHONES',
  CUSTOMER_DEBTS = 'CUSTOMER_DEBTS',
  SHOP_DEBTS = 'SHOP_DEBTS',
  INVENTORY_PHONES = 'INVENTORY_PHONES',
  INVENTORY_TOTAL_PRICE = 'INVENTORY_TOTAL_PRICE',
}

@Entity({ name: 'dashboard_metrics' })
export class DashboardMetric extends Extender {
  @Column({ type: 'enum', enum: DashboardMetricType })
  type: DashboardMetricType;

  @Column({ type: 'numeric', precision: 14, scale: 2 })
  amount: string;

  @Column({ type: 'timestamptz', default: () => 'now()' })
  happenedAt: Date;

  @Column({ type: 'text', nullable: true })
  notes: string | null;
}
