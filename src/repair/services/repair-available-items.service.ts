import { Injectable } from '@nestjs/common';
import { InventoryItemStatus } from 'src/inventory/entities/inventory-item.entity';
import {
  RepairAvailableItemDto,
  RepairAvailableItemsQueryDto,
} from '../dto/repair-result.dto';
import { RepairBaseService } from './repair-base.service';

@Injectable()
export class RepairAvailableItemsService extends RepairBaseService {
  async execute(
    query: RepairAvailableItemsQueryDto,
  ): Promise<RepairAvailableItemDto[]> {
    const builder = this.inventoryItemsRepository
      .createQueryBuilder('item')
      .select('item.id', 'id')
      .addSelect('item.imei', 'imei')
      .addSelect('item.brand', 'brand')
      .addSelect('item.model', 'model')
      .addSelect('item.condition', 'condition')
      .addSelect('item.status', 'status')
      .where('item.isActive = :isActive', { isActive: true })
      .andWhere('item.status IN (:...statuses)', {
        statuses: [InventoryItemStatus.IN_STOCK, InventoryItemStatus.READY_FOR_SALE],
      })
      .orderBy('item.id', 'DESC');

    if (query.q?.trim()) {
      builder.andWhere(
        '(item.imei ILIKE :q OR item.brand ILIKE :q OR item.model ILIKE :q)',
        { q: `%${query.q.trim()}%` },
      );
    }

    const rows = await builder.getRawMany<{
      id: string;
      imei: string;
      brand: string;
      model: string;
      condition: RepairAvailableItemDto['condition'];
      status: RepairAvailableItemDto['status'];
    }>();

    return rows.map((row) => ({
      id: Number(row.id),
      imei: row.imei,
      brand: row.brand,
      model: row.model,
      condition: row.condition,
      status: row.status,
    }));
  }
}
