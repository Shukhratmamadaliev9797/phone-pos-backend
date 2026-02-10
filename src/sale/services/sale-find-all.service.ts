import { Injectable } from '@nestjs/common';
import { SelectQueryBuilder } from 'typeorm';
import { SaleListQueryDto, SaleListResponseDto } from '../dto/sale-result.dto';
import { Sale } from '../entities/sale.entity';
import { toSaleListView } from '../helper';
import { SaleBaseService } from './sale-base.service';

@Injectable()
export class SaleFindAllService extends SaleBaseService {
  async execute(query: SaleListQueryDto): Promise<SaleListResponseDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    const builder = this.salesRepository
      .createQueryBuilder('sale')
      .leftJoinAndSelect(
        'sale.customer',
        'customer',
        'customer.isActive = :customerIsActive',
        { customerIsActive: true },
      )
      .where('sale.isActive = :isActive', { isActive: true });

    this.applyFilters(builder, query);

    const [data, total] = await builder
      .orderBy('sale.id', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    const totalsRaw = await this.buildTotalsQuery(query).getRawOne<{
      totalPriceSum: string;
      remainingSum: string;
    }>();

    const saleIds = data.map((sale) => sale.id);
    const countBySaleId = new Map<number, number>();
    const phoneLabelBySaleId = new Map<number, string | null>();

    if (saleIds.length > 0) {
      const itemCounts = await this.saleItemsRepository
        .createQueryBuilder('saleItem')
        .select('saleItem.saleId', 'saleId')
        .addSelect('COUNT(saleItem.id)', 'itemsCount')
        .where('saleItem.saleId IN (:...saleIds)', { saleIds })
        .andWhere('saleItem.isActive = :isActive', { isActive: true })
        .groupBy('saleItem.saleId')
        .getRawMany<{ saleId: string; itemsCount: string }>();

      for (const row of itemCounts) {
        countBySaleId.set(Number(row.saleId), Number(row.itemsCount));
      }

      const itemPhones = await this.saleItemsRepository
        .createQueryBuilder('saleItem')
        .leftJoin('saleItem.item', 'inventoryItem')
        .select('saleItem.saleId', 'saleId')
        .addSelect('saleItem.id', 'saleItemId')
        .addSelect('inventoryItem.brand', 'brand')
        .addSelect('inventoryItem.model', 'model')
        .where('saleItem.saleId IN (:...saleIds)', { saleIds })
        .andWhere('saleItem.isActive = :isActive', { isActive: true })
        .andWhere('inventoryItem.isActive = :inventoryActive', {
          inventoryActive: true,
        })
        .orderBy('saleItem.saleId', 'ASC')
        .addOrderBy('saleItem.id', 'ASC')
        .getRawMany<{
          saleId: string;
          brand: string | null;
          model: string | null;
        }>();

      for (const row of itemPhones) {
        const saleId = Number(row.saleId);
        if (phoneLabelBySaleId.has(saleId)) {
          continue;
        }
        const label = `${row.brand ?? ''} ${row.model ?? ''}`.trim();
        phoneLabelBySaleId.set(saleId, label || null);
      }
    }

    return {
      data: data.map((sale: Sale) =>
        toSaleListView(
          sale,
          countBySaleId.get(sale.id) ?? 0,
          phoneLabelBySaleId.get(sale.id) ?? null,
        ),
      ),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(total / limit)),
        totalPriceSum: totalsRaw?.totalPriceSum ?? '0.00',
        remainingSum: totalsRaw?.remainingSum ?? '0.00',
      },
    };
  }

  private applyFilters(
    builder: SelectQueryBuilder<Sale>,
    query: SaleListQueryDto,
  ): void {
    if (query.customerId) {
      builder.andWhere('sale.customerId = :customerId', {
        customerId: query.customerId,
      });
    }

    if (query.paymentType) {
      builder.andWhere('sale.paymentType = :paymentType', {
        paymentType: query.paymentType,
      });
    }

    if (query.from) {
      builder.andWhere('sale.soldAt >= :from', {
        from: this.parseDateOrNow(query.from),
      });
    }

    if (query.to) {
      builder.andWhere('sale.soldAt <= :to', {
        to: this.parseDateOrNow(query.to),
      });
    }
  }

  private buildTotalsQuery(query: SaleListQueryDto): SelectQueryBuilder<Sale> {
    const totalsBuilder = this.salesRepository
      .createQueryBuilder('sale')
      .select('COALESCE(SUM(sale.totalPrice), 0)', 'totalPriceSum')
      .addSelect('COALESCE(SUM(sale.remaining), 0)', 'remainingSum')
      .where('sale.isActive = :isActive', { isActive: true });

    this.applyFilters(totalsBuilder, query);
    return totalsBuilder;
  }
}
