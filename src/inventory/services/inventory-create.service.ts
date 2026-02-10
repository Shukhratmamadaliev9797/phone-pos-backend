import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { InventoryItemViewDto } from '../dto/inventory-item-view.dto';
import { CreateInventoryItemDto } from '../dto/create-inventory-item.dto';
import { InventoryItem, InventoryItemStatus } from '../entities/inventory-item.entity';
import {
  InventoryActivity,
  InventoryActivityType,
} from '../entities/inventory-activity.entity';
import { toInventoryItemView } from '../helper';

@Injectable()
export class InventoryCreateService {
  constructor(
    @InjectRepository(InventoryItem)
    private readonly inventoryItemsRepository: Repository<InventoryItem>,
    @InjectRepository(InventoryActivity)
    private readonly inventoryActivitiesRepository: Repository<InventoryActivity>,
  ) {}

  async execute(dto: CreateInventoryItemDto): Promise<InventoryItemViewDto> {
    const imei = dto.imei.trim();

    const existing = await this.inventoryItemsRepository.findOne({
      where: { imei },
      withDeleted: true,
    });
    if (existing?.isActive) {
      throw new ConflictException('IMEI already exists');
    }

    try {
      const saved = await this.inventoryItemsRepository.manager.transaction(
        async (manager) => {
          const repository = manager.getRepository(InventoryItem);
          const basePayload = {
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
          } as const;

          const persisted = existing
            ? await repository.save(
                repository.create({
                  ...existing,
                  ...basePayload,
                }),
              )
            : await repository.save(repository.create(basePayload));

          await manager.getRepository(InventoryActivity).save(
            manager.getRepository(InventoryActivity).create({
              item: persisted,
              type: InventoryActivityType.CREATED,
              fromStatus: existing?.status ?? null,
              toStatus: persisted.status,
              notes: `Phone added manually to inventory. Expected sale price: ${Number(
                dto.expectedSalePrice,
              ).toFixed(2)}`,
            }),
          );

          return persisted;
        },
      );
      return toInventoryItemView(saved);
    } catch (error) {
      if (error instanceof QueryFailedError) {
        const queryError = error as QueryFailedError & { code?: string };
        if (queryError.code === '23505') {
          throw new ConflictException('IMEI already exists');
        }
      }
      throw error;
    }
  }
}
