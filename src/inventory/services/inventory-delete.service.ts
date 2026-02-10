import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InventoryItem } from '../entities/inventory-item.entity';

@Injectable()
export class InventoryDeleteService {
  constructor(
    @InjectRepository(InventoryItem)
    private readonly inventoryItemsRepository: Repository<InventoryItem>,
  ) {}

  async execute(id: number): Promise<{ success: true }> {
    const item = await this.inventoryItemsRepository.findOne({
      where: { id, isActive: true },
    });

    if (!item) {
      throw new NotFoundException('Inventory item not found');
    }

    item.isActive = false;
    item.deletedAt = new Date();
    await this.inventoryItemsRepository.save(item);

    return { success: true };
  }
}
