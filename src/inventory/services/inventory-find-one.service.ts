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

    return toInventoryItemDetailView(item);
  }
}
