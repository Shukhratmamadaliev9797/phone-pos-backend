import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  InventoryItem,
  InventoryItemStatus,
} from 'src/inventory/entities/inventory-item.entity';
import { User } from 'src/user/user/entities/user.entity';
import { EntityManager, Repository } from 'typeorm';
import { RepairEntry } from '../entities/repair-entry.entity';
import { Repair } from '../entities/repair.entity';

@Injectable()
export class RepairBaseService {
  constructor(
    @InjectRepository(Repair)
    protected readonly repairsRepository: Repository<Repair>,
    @InjectRepository(RepairEntry)
    protected readonly repairEntriesRepository: Repository<RepairEntry>,
    @InjectRepository(InventoryItem)
    protected readonly inventoryItemsRepository: Repository<InventoryItem>,
    @InjectRepository(User)
    protected readonly usersRepository: Repository<User>,
  ) {}

  protected toMoney(value: number): string {
    return value.toFixed(2);
  }

  protected parseNumeric(value: string | number | undefined): number {
    if (value === undefined) {
      return 0;
    }

    const numeric = typeof value === 'string' ? Number(value) : value;
    if (!Number.isFinite(numeric)) {
      throw new BadRequestException('Numeric value is invalid');
    }
    return numeric;
  }

  protected parseDateOrNow(value?: string): Date {
    if (!value) {
      return new Date();
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      throw new BadRequestException('Invalid date format');
    }

    return parsed;
  }

  protected async resolveInventoryItemOrThrow(
    itemId: number | undefined,
    imei: string | undefined,
    manager?: EntityManager,
  ): Promise<InventoryItem> {
    if (!itemId && !imei) {
      throw new BadRequestException('itemId or imei is required');
    }

    const repository = manager
      ? manager.getRepository(InventoryItem)
      : this.inventoryItemsRepository;

    if (itemId) {
      const item = await repository.findOne({ where: { id: itemId, isActive: true } });
      if (!item) {
        throw new NotFoundException(`Inventory item ${itemId} not found`);
      }
      if (imei && item.imei !== imei) {
        throw new BadRequestException('itemId does not match imei');
      }
      return item;
    }

    const item = await repository.findOne({ where: { imei: imei as string, isActive: true } });
    if (!item) {
      throw new NotFoundException(`Inventory item with IMEI ${imei} not found`);
    }

    return item;
  }

  protected ensureRepairableItem(item: InventoryItem): void {
    if (item.status === InventoryItemStatus.SOLD) {
      throw new ConflictException('Sold item cannot be repaired');
    }

    if (item.status === InventoryItemStatus.IN_REPAIR) {
      throw new ConflictException('Item is already in repair');
    }

    if (
      item.status !== InventoryItemStatus.IN_STOCK &&
      item.status !== InventoryItemStatus.READY_FOR_SALE
    ) {
      throw new ConflictException(
        `Item status ${item.status} is not allowed for repair`,
      );
    }
  }

  protected async getActiveRepairOrThrow(
    id: number,
    manager?: EntityManager,
  ): Promise<Repair> {
    const repository = manager ? manager.getRepository(Repair) : this.repairsRepository;

    const repair = await repository.findOne({ where: { id, isActive: true } });

    if (!repair) {
      throw new NotFoundException('Repair case not found');
    }

    return repair;
  }

  protected async getActiveRepairWithRelationsOrThrow(
    id: number,
    manager?: EntityManager,
  ): Promise<Repair> {
    const repository = manager ? manager.getRepository(Repair) : this.repairsRepository;

    const repair = await repository
      .createQueryBuilder('repair')
      .leftJoinAndSelect(
        'repair.item',
        'item',
        'item.isActive = :itemIsActive',
        { itemIsActive: true },
      )
      .leftJoinAndSelect(
        'repair.technician',
        'technician',
        'technician.isActive = :technicianIsActive',
        { technicianIsActive: true },
      )
      .leftJoinAndSelect(
        'repair.entries',
        'entry',
        'entry.isActive = :entryIsActive',
        { entryIsActive: true },
      )
      .where('repair.id = :id', { id })
      .andWhere('repair.isActive = :isActive', { isActive: true })
      .orderBy('entry.entryAt', 'ASC')
      .addOrderBy('entry.id', 'ASC')
      .getOne();

    if (!repair) {
      throw new NotFoundException('Repair case not found');
    }

    return repair;
  }

  protected async getActiveTechnicianOrThrow(
    id: number,
    manager?: EntityManager,
  ): Promise<User> {
    const repository = manager ? manager.getRepository(User) : this.usersRepository;

    const user = await repository.findOne({
      where: { id, isActive: true },
    });

    if (!user) {
      throw new NotFoundException('Technician not found');
    }

    return user;
  }

  protected recalculateRepairCosts(repair: Repair): void {
    const entries = repair.entries ?? [];

    const total = entries.reduce(
      (sum, entry) => sum + Number(entry.costTotal ?? 0),
      0,
    );
    const parts = entries.reduce(
      (sum, entry) => sum + Number(entry.partsCost ?? 0),
      0,
    );
    const labor = entries.reduce(
      (sum, entry) => sum + Number(entry.laborCost ?? 0),
      0,
    );

    repair.costTotal = this.toMoney(total);
    repair.partsCost = entries.length > 0 ? this.toMoney(parts) : null;
    repair.laborCost = entries.length > 0 ? this.toMoney(labor) : null;
  }
}
