import { Injectable } from '@nestjs/common';
import { InventoryItem } from 'src/inventory/entities/inventory-item.entity';
import { PurchaseActivity } from 'src/purchase/entities/purchase-activity.entity';
import { Purchase } from 'src/purchase/entities/purchase.entity';
import { SaleActivity } from 'src/sale/entities/sale-activity.entity';
import { Sale } from 'src/sale/entities/sale.entity';
import { CustomerDetailDto } from '../dto/customer-detail.dto';
import { toCustomerView } from '../helper';
import { CustomerBaseService } from './customer-base.service';

@Injectable()
export class CustomerFindDetailService extends CustomerBaseService {
  async execute(id: number): Promise<CustomerDetailDto> {
    const customer = await this.getActiveCustomerOrThrow(id);

    const [
      debtRaw,
      creditRaw,
      soldRaw,
      purchasedRaw,
      salePayments,
      purchasePayments,
      openSalesRaw,
      openPurchasesRaw,
    ] =
      await Promise.all([
        this.customersRepository.manager
          .createQueryBuilder()
          .select('COALESCE(SUM(sale.remaining), 0)', 'debt')
          .addSelect('MAX(sale.soldAt)', 'lastSaleAt')
          .from(Sale, 'sale')
          .where('sale.isActive = true')
          .andWhere('sale.customerId = :customerId', { customerId: id })
          .andWhere('sale.remaining > 0')
          .getRawOne<{ debt: string; lastSaleAt: string | null }>(),
        this.customersRepository.manager
          .createQueryBuilder()
          .select('COALESCE(SUM(purchase.remaining), 0)', 'credit')
          .addSelect('MAX(purchase.purchasedAt)', 'lastPurchaseAt')
          .from(Purchase, 'purchase')
          .where('purchase.isActive = true')
          .andWhere('purchase.customerId = :customerId', { customerId: id })
          .andWhere('purchase.remaining > 0')
          .getRawOne<{ credit: string; lastPurchaseAt: string | null }>(),
        this.customersRepository.manager
          .createQueryBuilder()
          .select(
            `STRING_AGG(DISTINCT CONCAT(inventoryItem.brand, ' ', inventoryItem.model), ', ')`,
            'phones',
          )
          .from(InventoryItem, 'inventoryItem')
          .innerJoin(Sale, 'sale', 'sale.id = inventoryItem.saleId')
          .where('inventoryItem.isActive = true')
          .andWhere('sale.isActive = true')
          .andWhere('sale.customerId = :customerId', { customerId: id })
          .getRawOne<{ phones: string | null }>(),
        this.customersRepository.manager
          .createQueryBuilder()
          .select(
            `STRING_AGG(DISTINCT CONCAT(inventoryItem.brand, ' ', inventoryItem.model), ', ')`,
            'phones',
          )
          .from(InventoryItem, 'inventoryItem')
          .innerJoin(Purchase, 'purchase', 'purchase.id = inventoryItem.purchaseId')
          .where('inventoryItem.isActive = true')
          .andWhere('purchase.isActive = true')
          .andWhere('purchase.customerId = :customerId', { customerId: id })
          .getRawOne<{ phones: string | null }>(),
        this.customersRepository.manager
          .createQueryBuilder()
          .select('saleActivity.paidAt', 'paidAt')
          .addSelect('saleActivity.amount', 'amount')
          .addSelect('saleActivity.notes', 'notes')
          .from(SaleActivity, 'saleActivity')
          .innerJoin(Sale, 'sale', 'sale.id = saleActivity.saleId')
          .where('saleActivity.isActive = true')
          .andWhere('sale.isActive = true')
          .andWhere('sale.customerId = :customerId', { customerId: id })
          .getRawMany<{ paidAt: string; amount: string; notes: string | null }>(),
        this.customersRepository.manager
          .createQueryBuilder()
          .select('purchaseActivity.paidAt', 'paidAt')
          .addSelect('purchaseActivity.amount', 'amount')
          .addSelect('purchaseActivity.notes', 'notes')
          .from(PurchaseActivity, 'purchaseActivity')
          .innerJoin(Purchase, 'purchase', 'purchase.id = purchaseActivity.purchaseId')
          .where('purchaseActivity.isActive = true')
          .andWhere('purchase.isActive = true')
          .andWhere('purchase.customerId = :customerId', { customerId: id })
          .getRawMany<{ paidAt: string; amount: string; notes: string | null }>(),
        this.customersRepository.manager
          .createQueryBuilder()
          .select('sale.id', 'id')
          .addSelect('sale.remaining', 'remaining')
          .addSelect('sale.soldAt', 'soldAt')
          .from(Sale, 'sale')
          .where('sale.isActive = true')
          .andWhere('sale.customerId = :customerId', { customerId: id })
          .andWhere('sale.remaining > 0')
          .orderBy('sale.soldAt', 'DESC')
          .getRawMany<{ id: string; remaining: string; soldAt: string }>(),
        this.customersRepository.manager
          .createQueryBuilder()
          .select('purchase.id', 'id')
          .addSelect('purchase.remaining', 'remaining')
          .addSelect('purchase.purchasedAt', 'purchasedAt')
          .from(Purchase, 'purchase')
          .where('purchase.isActive = true')
          .andWhere('purchase.customerId = :customerId', { customerId: id })
          .andWhere('purchase.remaining > 0')
          .orderBy('purchase.purchasedAt', 'DESC')
          .getRawMany<{ id: string; remaining: string; purchasedAt: string }>(),
      ]);

    const activities = [
      ...salePayments.map((p) => ({
        type: 'SALE_PAYMENT' as const,
        paidAt: new Date(p.paidAt),
        amount: Number(p.amount),
        notes: p.notes,
      })),
      ...purchasePayments.map((p) => ({
        type: 'PURCHASE_PAYMENT' as const,
        paidAt: new Date(p.paidAt),
        amount: Number(p.amount),
        notes: p.notes,
      })),
    ].sort((a, b) => b.paidAt.getTime() - a.paidAt.getTime());

    const lastPayment = activities[0];
    const lastActivityAt = this.maxDateIso(
      debtRaw?.lastSaleAt ?? null,
      creditRaw?.lastPurchaseAt ?? null,
    );

    const debt = Number(debtRaw?.debt ?? 0);
    const credit = Number(creditRaw?.credit ?? 0);

    return {
      customer: toCustomerView(customer),
      debt,
      credit,
      totalDue: debt + credit,
      soldPhones: soldRaw?.phones ?? null,
      purchasedPhones: purchasedRaw?.phones ?? null,
      lastActivityAt,
      lastPaymentAt: lastPayment?.paidAt.toISOString(),
      lastPaymentAmount: lastPayment?.amount,
      activities,
      openSales: openSalesRaw.map((sale) => ({
        id: Number(sale.id),
        remaining: Number(sale.remaining),
        soldAt: new Date(sale.soldAt),
      })),
      openPurchases: openPurchasesRaw.map((purchase) => ({
        id: Number(purchase.id),
        remaining: Number(purchase.remaining),
        purchasedAt: new Date(purchase.purchasedAt),
      })),
    };
  }

  private maxDateIso(a: string | null, b: string | null): string | null {
    if (!a) return b;
    if (!b) return a;
    return new Date(a).getTime() >= new Date(b).getTime() ? a : b;
  }
}
