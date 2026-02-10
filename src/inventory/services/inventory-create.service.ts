import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InventoryItemViewDto } from '../dto/inventory-item-view.dto';
import { CreateInventoryItemDto } from '../dto/create-inventory-item.dto';
import { InventoryItem, InventoryItemStatus } from '../entities/inventory-item.entity';
import { toInventoryItemView } from '../helper';

@Injectable()
export class InventoryCreateService {
  constructor(
    @InjectRepository(InventoryItem)
    private readonly inventoryItemsRepository: Repository<InventoryItem>,
  ) {}

  async execute(dto: CreateInventoryItemDto): Promise<InventoryItemViewDto> {
    const imei = dto.imei.trim();

    const existing = await this.inventoryItemsRepository.findOne({
      where: { imei, isActive: true },
    });
    if (existing) {
      throw new ConflictException('IMEI already exists');
    }

    const item = this.inventoryItemsRepository.create({
      imei,
      serialNumber: dto.serialNumber?.trim() || null,
      brand: dto.brand.trim(),
      model: dto.model.trim(),
      storage: dto.storage?.trim() || null,
      color: dto.color?.trim() || null,
      condition: dto.condition,
      status: dto.status ?? InventoryItemStatus.IN_STOCK,
      knownIssues: dto.knownIssues?.trim() || null,
      expectedSalePrice: Number(dto.expectedSalePrice).toFixed(2),
      purchase: null,
      sale: null,
      isActive: true,
      deletedAt: null,
    });

    const saved = await this.inventoryItemsRepository.save(item);
    return toInventoryItemView(saved);
  }
}
