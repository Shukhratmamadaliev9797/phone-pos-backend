import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { toInventoryItemView } from '../helper';
import { InventoryItemViewDto } from '../dto/inventory-item-view.dto';
import { UpdateInventoryItemDto } from '../dto/update-inventory-item.dto';
import { InventoryItem } from '../entities/inventory-item.entity';

@Injectable()
export class InventoryUpdateService {
  constructor(
    @InjectRepository(InventoryItem)
    private readonly inventoryItemsRepository: Repository<InventoryItem>,
  ) {}

  async execute(
    id: number,
    dto: UpdateInventoryItemDto,
  ): Promise<InventoryItemViewDto> {
    const item = await this.inventoryItemsRepository.findOne({
      where: { id, isActive: true },
    });

    if (!item) {
      throw new NotFoundException('Inventory item not found');
    }

    if (dto.imei !== undefined) {
      const nextImei = dto.imei.trim();
      if (!nextImei) {
        throw new BadRequestException('IMEI cannot be empty');
      }

      if (nextImei !== item.imei) {
        const exists = await this.inventoryItemsRepository.findOne({
          where: { imei: nextImei, isActive: true },
        });
        if (exists) {
          throw new ConflictException('IMEI already exists');
        }
      }
      item.imei = nextImei;
    }

    if (dto.serialNumber !== undefined) {
      item.serialNumber = dto.serialNumber?.trim() || null;
    }
    if (dto.brand !== undefined) {
      item.brand = dto.brand.trim();
    }
    if (dto.model !== undefined) {
      item.model = dto.model.trim();
    }
    if (dto.storage !== undefined) {
      item.storage = dto.storage?.trim() || null;
    }
    if (dto.color !== undefined) {
      item.color = dto.color?.trim() || null;
    }
    if (dto.condition !== undefined) {
      item.condition = dto.condition;
    }
    if (dto.status !== undefined) {
      item.status = dto.status;
    }
    if (dto.knownIssues !== undefined) {
      item.knownIssues = dto.knownIssues?.trim() || null;
    }
    if (dto.expectedSalePrice !== undefined) {
      item.expectedSalePrice =
        dto.expectedSalePrice === null
          ? null
          : Number(dto.expectedSalePrice).toFixed(2);
    }

    const saved = await this.inventoryItemsRepository.save(item);
    return toInventoryItemView(saved);
  }
}
