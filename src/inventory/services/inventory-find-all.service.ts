import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  InventoryListItemDto,
  InventoryListResponseDto,
  InventoryItemsQueryDto,
} from '../dto/inventory-items-query.dto';
import { InventoryItem } from '../entities/inventory-item.entity';

type InventoryRowRaw = {
  id: number;
  imei: string;
  storage: string | null;
  serialNumber: string | null;
  purchaseId: number | null;
  saleId: number | null;
  brand: string;
  model: string;
  condition: string;
  status: string;
  knownIssues: string | null;
  expectedSalePrice: string | null;
  purchaseCost: string;
  repairCost: string;
};

@Injectable()
export class InventoryFindAllService {
  constructor(
    @InjectRepository(InventoryItem)
    private readonly inventoryItemsRepository: Repository<InventoryItem>,
  ) {}

  async execute(query: InventoryItemsQueryDto): Promise<InventoryListResponseDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    const qb = this.inventoryItemsRepository
      .createQueryBuilder('item')
      .leftJoin(
        'purchase_items',
        'purchaseItem',
        '"purchaseItem"."itemId" = item.id AND "purchaseItem"."isActive" = true',
      )
      .leftJoin(
        'repairs',
        'repair',
        '"repair"."itemId" = item.id AND repair."isActive" = true',
      )
      .where('item."isActive" = true')
      .andWhere('item.status != :soldStatus', { soldStatus: 'SOLD' });

    if (query.q?.trim()) {
      qb.andWhere(
        '(item.imei ILIKE :search OR item.brand ILIKE :search OR item.model ILIKE :search)',
        {
          search: `%${query.q.trim()}%`,
        },
      );
    }

    if (query.status) {
      qb.andWhere('item.status = :status', { status: query.status });
    }

    if (query.condition) {
      qb.andWhere('item.condition = :condition', { condition: query.condition });
    }

    const totalRaw = await qb
      .clone()
      .select('COUNT(DISTINCT item.id)', 'total')
      .getRawOne<{ total: string }>();

    const raws = await qb
      .select('item.id', 'id')
      .addSelect('item.imei', 'imei')
      .addSelect('item.storage', 'storage')
      .addSelect('item."serialNumber"', 'serialNumber')
      .addSelect('item."purchaseId"', 'purchaseId')
      .addSelect('item."saleId"', 'saleId')
      .addSelect('item.brand', 'brand')
      .addSelect('item.model', 'model')
      .addSelect('item.condition', 'condition')
      .addSelect('item.status', 'status')
      .addSelect('item."knownIssues"', 'knownIssues')
      .addSelect('item."expectedSalePrice"', 'expectedSalePrice')
      .addSelect('COALESCE(MAX("purchaseItem"."purchasePrice"), 0)', 'purchaseCost')
      .addSelect('COALESCE(SUM(repair."costTotal"), 0)', 'repairCost')
      .groupBy('item.id')
      .addGroupBy('item.imei')
      .addGroupBy('item.storage')
      .addGroupBy('item."serialNumber"')
      .addGroupBy('item."purchaseId"')
      .addGroupBy('item."saleId"')
      .addGroupBy('item.brand')
      .addGroupBy('item.model')
      .addGroupBy('item.condition')
      .addGroupBy('item.status')
      .addGroupBy('item."knownIssues"')
      .addGroupBy('item."expectedSalePrice"')
      .orderBy('item.id', 'DESC')
      .offset((page - 1) * limit)
      .limit(limit)
      .getRawMany<InventoryRowRaw>();

    const data: InventoryListItemDto[] = raws.map((row) => {
      const purchaseCost = Number(row.purchaseCost ?? 0);
      const repairCost = Number(row.repairCost ?? 0);

      return {
        id: row.id,
        itemName: `${row.brand} ${row.model}`.trim(),
        brand: row.brand,
        model: row.model,
        imei: row.imei,
        storage: row.storage,
        serialNumber: row.serialNumber,
        purchaseId: row.purchaseId,
        saleId: row.saleId,
        condition: row.condition as InventoryListItemDto['condition'],
        status: row.status as InventoryListItemDto['status'],
        purchaseCost,
        repairCost,
        cost: purchaseCost + repairCost,
        expectedSalePrice:
          row.expectedSalePrice === null ? null : Number(row.expectedSalePrice),
        knownIssues: row.knownIssues,
      };
    });

    const total = Number(totalRaw?.total ?? 0);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }
}
