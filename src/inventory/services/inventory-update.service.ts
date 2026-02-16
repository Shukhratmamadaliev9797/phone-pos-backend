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
import {
  InventoryActivity,
  InventoryActivityType,
} from '../entities/inventory-activity.entity';
import { InventoryItemStatus } from '../entities/inventory-item.entity';
import { Repair, RepairStatus } from 'src/repair/entities/repair.entity';

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
    const prevStatus = item.status;
    let nextStatus = item.status;
    if (dto.status !== undefined) {
      item.status = dto.status;
      nextStatus = dto.status;
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

    const saved = await this.inventoryItemsRepository.manager.transaction(
      async (manager) => {
        const persisted = await manager.getRepository(InventoryItem).save(item);
        const repairsRepository = manager.getRepository(Repair);

        if (prevStatus !== nextStatus) {
          const type =
            prevStatus !== InventoryItemStatus.IN_REPAIR &&
            nextStatus === InventoryItemStatus.IN_REPAIR
              ? InventoryActivityType.MOVED_TO_REPAIR
              : prevStatus === InventoryItemStatus.IN_REPAIR &&
                  nextStatus === InventoryItemStatus.READY_FOR_SALE
                ? InventoryActivityType.MARKED_DONE
                : InventoryActivityType.STATUS_CHANGED;

          const activity = manager.getRepository(InventoryActivity).create({
            item: persisted,
            type,
            fromStatus: prevStatus,
            toStatus: nextStatus,
            notes:
              type === InventoryActivityType.MARKED_DONE
                ? 'Inventory status changed to ready for sale'
                : type === InventoryActivityType.MOVED_TO_REPAIR
                  ? 'Inventory item moved to repair'
                  : `Inventory status changed from ${prevStatus} to ${nextStatus}`,
          });
          await manager.getRepository(InventoryActivity).save(activity);
        }

        if (dto.repairCost !== undefined) {
          const normalizedRepairCost = Math.max(0, Number(dto.repairCost ?? 0));
          const latestRepair = await repairsRepository.findOne({
            where: { item: { id: persisted.id }, isActive: true },
            relations: { item: true },
            order: { repairedAt: 'DESC', id: 'DESC' },
          });

          if (latestRepair) {
            latestRepair.costTotal = normalizedRepairCost.toFixed(2);
            if (dto.knownIssues !== undefined) {
              latestRepair.description =
                dto.knownIssues?.trim() || latestRepair.description;
            }
            latestRepair.status =
              nextStatus === InventoryItemStatus.IN_REPAIR
                ? RepairStatus.PENDING
                : RepairStatus.DONE;
            await repairsRepository.save(latestRepair);
          } else if (normalizedRepairCost > 0) {
            await repairsRepository.save(
              repairsRepository.create({
                item: persisted,
                repairedAt: new Date(),
                description:
                  dto.knownIssues?.trim() ||
                  'Repair cost added from inventory edit',
                status:
                  nextStatus === InventoryItemStatus.IN_REPAIR
                    ? RepairStatus.PENDING
                    : RepairStatus.DONE,
                costTotal: normalizedRepairCost.toFixed(2),
                partsCost: null,
                laborCost: null,
                notes: dto.knownIssues?.trim() || null,
              }),
            );
          }
        }

        return persisted;
      },
    );
    return toInventoryItemView(saved);
  }
}
