import { Injectable } from '@nestjs/common';
import { InventoryItem } from 'src/inventory/entities/inventory-item.entity';
import { PurchaseItem } from 'src/purchase/entities/purchase-item.entity';
import { PurchaseActivity } from 'src/purchase/entities/purchase-activity.entity';
import { Purchase } from 'src/purchase/entities/purchase.entity';
import { SaleActivity } from 'src/sale/entities/sale-activity.entity';
import { SaleItem } from 'src/sale/entities/sale-item.entity';
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
      openSales,
      openPurchases,
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
          .getRepository(Sale)
          .createQueryBuilder('sale')
          .leftJoinAndSelect('sale.items', 'saleItem', 'saleItem.isActive = true')
          .leftJoinAndSelect('saleItem.item', 'inventoryItem', 'inventoryItem.isActive = true')
          .where('sale.isActive = true')
          .andWhere('sale.customerId = :customerId', { customerId: id })
          .andWhere('sale.remaining > 0')
          .orderBy('sale.soldAt', 'DESC')
          .getMany(),
        this.customersRepository.manager
          .getRepository(Purchase)
          .createQueryBuilder('purchase')
          .leftJoinAndSelect(
            'purchase.items',
            'purchaseItem',
            'purchaseItem.isActive = true',
          )
          .leftJoinAndSelect(
            'purchaseItem.item',
            'inventoryItem',
            'inventoryItem.isActive = true',
          )
          .where('purchase.isActive = true')
          .andWhere('purchase.customerId = :customerId', { customerId: id })
          .andWhere('purchase.remaining > 0')
          .orderBy('purchase.purchasedAt', 'DESC')
          .getMany(),
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
      openSales: openSales.map((sale) => ({
        id: sale.id,
        total: Number(sale.totalPrice ?? 0),
        paid: Number(sale.paidNow ?? 0),
        remaining: Number(sale.remaining ?? 0),
        paymentType: sale.paymentType,
        soldAt: sale.soldAt,
        phones: (sale.items ?? [])
          .filter((item: SaleItem) => item?.isActive && item.item?.isActive)
          .map((item: SaleItem) => ({
            brand: item.item.brand,
            model: item.item.model,
            imei: item.item.imei,
            storage: item.item.storage,
            condition: item.item.condition,
            status: item.item.status,
          })),
      })),
      openPurchases: openPurchases.map((purchase) => ({
        id: purchase.id,
        total: Number(purchase.totalPrice ?? 0),
        paid: Number(purchase.paidNow ?? 0),
        remaining: Number(purchase.remaining ?? 0),
        paymentType: purchase.paymentType,
        purchasedAt: purchase.purchasedAt,
        phones: (purchase.items ?? [])
          .filter(
            (item: PurchaseItem) => item?.isActive && item.item?.isActive,
          )
          .map((item: PurchaseItem) => ({
            brand: item.item.brand,
            model: item.item.model,
            imei: item.item.imei,
            storage: item.item.storage,
            condition: item.item.condition,
            status: item.item.status,
          })),
      })),
    };
  }

  private maxDateIso(a: string | null, b: string | null): string | null {
    if (!a) return b;
    if (!b) return a;
    return new Date(a).getTime() >= new Date(b).getTime() ? a : b;
  }
}
