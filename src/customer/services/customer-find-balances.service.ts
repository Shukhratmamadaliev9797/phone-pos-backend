import { Injectable } from '@nestjs/common';
import { Purchase } from 'src/purchase/entities/purchase.entity';
import { Sale } from 'src/sale/entities/sale.entity';
import { PurchaseActivity } from 'src/purchase/entities/purchase-activity.entity';
import { SaleActivity } from 'src/sale/entities/sale-activity.entity';
import { InventoryItem } from 'src/inventory/entities/inventory-item.entity';
import { Customer } from '../entities/customer.entity';
import {
  CustomerBalancesQueryDto,
  CustomerBalancesResponseDto,
  CustomerBalanceType,
} from '../dto/customer-balance.dto';
import { toCustomerView } from '../helper';
import { CustomerBaseService } from './customer-base.service';

@Injectable()
export class CustomerFindBalancesService extends CustomerBaseService {
  async execute(query: CustomerBalancesQueryDto): Promise<CustomerBalancesResponseDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const type = query.type ?? CustomerBalanceType.ALL;
    const search = query.search?.trim();

    const customers = await this.customersRepository
      .createQueryBuilder('customer')
      .where('customer.isActive = :isActive', { isActive: true })
      .andWhere(
        search
          ? '(customer.phoneNumber ILIKE :search OR customer.fullName ILIKE :search)'
          : '1=1',
        { search: `%${search}%` },
      )
      .orderBy('customer.id', 'DESC')
      .getMany();

    const [debtRows, creditRows] = await Promise.all([
      this.customersRepository.manager
        .createQueryBuilder()
        .select('sale.customerId', 'customerId')
        .addSelect('SUM(sale.remaining)', 'debt')
        .addSelect('MAX(sale.soldAt)', 'lastSaleAt')
        .from(Sale, 'sale')
        .where('sale.isActive = true')
        .andWhere('sale.remaining > 0')
        .andWhere('sale.customerId IS NOT NULL')
        .groupBy('sale.customerId')
        .getRawMany<{ customerId: string; debt: string; lastSaleAt: string | null }>(),
      this.customersRepository.manager
        .createQueryBuilder()
        .select('purchase.customerId', 'customerId')
        .addSelect('SUM(purchase.remaining)', 'credit')
        .addSelect('MAX(purchase.purchasedAt)', 'lastPurchaseAt')
        .from(Purchase, 'purchase')
        .where('purchase.isActive = true')
        .andWhere('purchase.remaining > 0')
        .andWhere('purchase.customerId IS NOT NULL')
        .groupBy('purchase.customerId')
        .getRawMany<{ customerId: string; credit: string; lastPurchaseAt: string | null }>(),
    ]);

    const debtByCustomer = new Map<
      number,
      { debt: number; lastSaleAt: string | null }
    >();
    for (const row of debtRows) {
      debtByCustomer.set(Number(row.customerId), {
        debt: Number(row.debt ?? 0),
        lastSaleAt: row.lastSaleAt,
      });
    }

    const creditByCustomer = new Map<
      number,
      { credit: number; lastPurchaseAt: string | null }
    >();
    for (const row of creditRows) {
      creditByCustomer.set(Number(row.customerId), {
        credit: Number(row.credit ?? 0),
        lastPurchaseAt: row.lastPurchaseAt,
      });
    }

    const filtered = customers
      .map((customer) => {
        const debtInfo = debtByCustomer.get(customer.id);
        const creditInfo = creditByCustomer.get(customer.id);
        const debt = debtInfo?.debt ?? 0;
        const credit = creditInfo?.credit ?? 0;
        const lastActivityAt = this.maxDateIso(
          debtInfo?.lastSaleAt ?? null,
          creditInfo?.lastPurchaseAt ?? null,
        );
        return { customer, debt, credit, lastActivityAt };
      })
      .filter((row) => row.debt > 0 || row.credit > 0)
      .filter((row) => {
        if (type === CustomerBalanceType.DEBT) return row.debt > 0;
        if (type === CustomerBalanceType.CREDIT) return row.credit > 0;
        return true;
      })
      .sort((a, b) => {
        const aTime = a.lastActivityAt ? new Date(a.lastActivityAt).getTime() : 0;
        const bTime = b.lastActivityAt ? new Date(b.lastActivityAt).getTime() : 0;
        if (bTime !== aTime) return bTime - aTime;
        return b.customer.id - a.customer.id;
      });

    const total = filtered.length;
    const paged = filtered.slice((page - 1) * limit, page * limit);
    const customerIds = paged.map((row) => row.customer.id);
    const lastPaymentByCustomer = new Map<
      number,
      { paidAt: Date; amount: number }
    >();
    const soldPhonesByCustomer = new Map<number, string>();
    const purchasedPhonesByCustomer = new Map<number, string>();

    if (customerIds.length > 0) {
      const [salePayments, purchasePayments, soldPhoneRows, purchasedPhoneRows] =
        await Promise.all([
        this.customersRepository.manager
          .createQueryBuilder()
          .select('sale.customerId', 'customerId')
          .addSelect('saleActivity.paidAt', 'paidAt')
          .addSelect('saleActivity.amount', 'amount')
          .from(SaleActivity, 'saleActivity')
          .innerJoin(Sale, 'sale', 'sale.id = saleActivity.saleId')
          .where('saleActivity.isActive = true')
          .andWhere('sale.isActive = true')
          .andWhere('sale.customerId IN (:...customerIds)', { customerIds })
          .getRawMany<{ customerId: string; paidAt: string; amount: string }>(),
        this.customersRepository.manager
          .createQueryBuilder()
          .select('purchase.customerId', 'customerId')
          .addSelect('purchaseActivity.paidAt', 'paidAt')
          .addSelect('purchaseActivity.amount', 'amount')
          .from(PurchaseActivity, 'purchaseActivity')
          .innerJoin(Purchase, 'purchase', 'purchase.id = purchaseActivity.purchaseId')
          .where('purchaseActivity.isActive = true')
          .andWhere('purchase.isActive = true')
          .andWhere('purchase.customerId IN (:...customerIds)', { customerIds })
          .getRawMany<{ customerId: string; paidAt: string; amount: string }>(),
        this.customersRepository.manager
          .createQueryBuilder()
          .select('sale.customerId', 'customerId')
          .addSelect(
            `STRING_AGG(DISTINCT CONCAT(inventoryItem.brand, ' ', inventoryItem.model), ', ')`,
            'phones',
          )
          .from(InventoryItem, 'inventoryItem')
          .innerJoin(Sale, 'sale', 'sale.id = inventoryItem.saleId')
          .where('inventoryItem.isActive = true')
          .andWhere('sale.isActive = true')
          .andWhere('sale.customerId IN (:...customerIds)', { customerIds })
          .groupBy('sale.customerId')
          .getRawMany<{ customerId: string; phones: string | null }>(),
        this.customersRepository.manager
          .createQueryBuilder()
          .select('purchase.customerId', 'customerId')
          .addSelect(
            `STRING_AGG(DISTINCT CONCAT(inventoryItem.brand, ' ', inventoryItem.model), ', ')`,
            'phones',
          )
          .from(InventoryItem, 'inventoryItem')
          .innerJoin(Purchase, 'purchase', 'purchase.id = inventoryItem.purchaseId')
          .where('inventoryItem.isActive = true')
          .andWhere('purchase.isActive = true')
          .andWhere('purchase.customerId IN (:...customerIds)', { customerIds })
          .groupBy('purchase.customerId')
          .getRawMany<{ customerId: string; phones: string | null }>(),
      ]);

      for (const row of [...salePayments, ...purchasePayments]) {
        const customerId = Number(row.customerId);
        const paidAt = new Date(row.paidAt);
        const current = lastPaymentByCustomer.get(customerId);
        if (!current || paidAt > current.paidAt) {
          lastPaymentByCustomer.set(customerId, {
            paidAt,
            amount: Number(row.amount),
          });
        }
      }

      for (const row of soldPhoneRows) {
        soldPhonesByCustomer.set(Number(row.customerId), row.phones ?? '');
      }

      for (const row of purchasedPhoneRows) {
        purchasedPhonesByCustomer.set(Number(row.customerId), row.phones ?? '');
      }
    }

    return {
      data: paged.map((row) => ({
        customer: toCustomerView(row.customer as Customer),
        debt: row.debt,
        credit: row.credit,
        lastActivityAt: row.lastActivityAt,
        lastPaymentAt:
          lastPaymentByCustomer.get(row.customer.id)?.paidAt.toISOString() ??
          undefined,
        lastPaymentAmount: lastPaymentByCustomer.get(row.customer.id)?.amount,
        soldPhones: soldPhonesByCustomer.get(row.customer.id) ?? null,
        purchasedPhones: purchasedPhonesByCustomer.get(row.customer.id) ?? null,
        totalDue: row.debt + row.credit,
      })),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }

  private maxDateIso(a: string | null, b: string | null): string | null {
    if (!a) return b;
    if (!b) return a;
    return new Date(a).getTime() >= new Date(b).getTime() ? a : b;
  }
}
