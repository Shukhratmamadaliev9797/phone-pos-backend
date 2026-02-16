import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InventoryItemDetailViewDto } from '../dto/inventory-item-view.dto';
import { InventoryItem } from '../entities/inventory-item.entity';
import { toInventoryItemDetailView } from '../helper';

@Injectable()
export class InventoryFindOneService {
  constructor(
    @InjectRepository(InventoryItem)
    private readonly inventoryItemsRepository: Repository<InventoryItem>,
  ) {}

  async execute(id: number): Promise<InventoryItemDetailViewDto> {
    const item = await this.inventoryItemsRepository.findOne({
      where: { id, isActive: true },
      relations: { activities: true },
      order: { activities: { happenedAt: 'DESC' } },
    });

    if (!item) {
      throw new NotFoundException('Inventory item not found');
    }

    const repairSumRaw = await this.inventoryItemsRepository.manager.query<
      Array<{ value: string | null }>
    >(
      `SELECT COALESCE(SUM(r."costTotal"), 0) AS value
       FROM "repairs" r
       WHERE r."isActive" = true
         AND r."itemId" = $1`,
      [id],
    );
    const repairCost = Number(repairSumRaw[0]?.value ?? 0);

    return toInventoryItemDetailView(item, repairCost);
  }
}
