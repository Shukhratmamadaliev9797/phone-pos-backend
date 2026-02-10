import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Customer } from 'src/customer/entities/customer.entity';
import {
  InventoryItem,
  InventoryItemCondition,
  InventoryItemStatus,
} from 'src/inventory/entities/inventory-item.entity';
import { EntityManager, QueryFailedError, Repository } from 'typeorm';
import { InitialPurchaseItemStatus } from '../dto/create-purchase.dto';
import {
  UpdatePurchaseItemDto,
  UpdatePurchaseCustomerDto,
  UpdatePurchaseDto,
} from '../dto/update-purchase.dto';
import { PurchaseDetailViewDto } from '../dto/purchase-result.dto';
import { PurchaseActivity } from '../entities/purchase-activity.entity';
import { PurchaseItem } from '../entities/purchase-item.entity';
import { Purchase, PurchasePaymentType } from '../entities/purchase.entity';
import { toPurchaseDetailView } from '../helper';
import { PurchaseBaseService } from './purchase-base.service';

@Injectable()
export class PurchaseUpdateService extends PurchaseBaseService {
  constructor(
    @InjectRepository(Purchase)
    purchasesRepository: Repository<Purchase>,
    @InjectRepository(PurchaseItem)
    purchaseItemsRepository: Repository<PurchaseItem>,
    @InjectRepository(InventoryItem)
    inventoryItemsRepository: Repository<InventoryItem>,
    @InjectRepository(Customer)
    customersRepository: Repository<Customer>,
    @InjectRepository(PurchaseActivity)
    purchaseActivitiesRepository: Repository<PurchaseActivity>,
  ) {
    super(
      purchasesRepository,
      purchaseItemsRepository,
      inventoryItemsRepository,
      customersRepository,
      purchaseActivitiesRepository,
    );
  }

  async execute(id: number, dto: UpdatePurchaseDto): Promise<PurchaseDetailViewDto> {
    try {
      await this.purchasesRepository.manager.transaction(async (manager) => {
        const purchase = await this.getActivePurchaseOrThrow(id, manager);
        const totalPrice =
          dto.items && dto.items.length > 0
            ? await this.applyItemsUpdate(manager, purchase, dto.items)
            : await this.getCurrentTotal(manager, purchase.id);
        const paymentType = dto.paymentType ?? purchase.paymentType;
        const paidNow =
          dto.paidNow !== undefined
            ? this.parseNumeric(dto.paidNow)
            : this.parseNumeric(purchase.paidNow);

        if (paymentType === PurchasePaymentType.PAID_NOW && paidNow < totalPrice) {
          throw new BadRequestException(
            'PAID_NOW requires paidNow to equal totalPrice',
          );
        }

        const remaining = totalPrice - paidNow;
        this.ensureNonNegativeRemaining(remaining);

        const resolvedCustomer = await this.resolveCustomerForUpdate(
          manager,
          purchase.customerId ?? null,
          dto.customerId,
          dto.customer,
        );

        this.ensureCustomerRequirement(
          paymentType,
          resolvedCustomer?.id,
          remaining,
        );

        purchase.purchasedAt = dto.purchasedAt
          ? this.parseDateOrNow(dto.purchasedAt)
          : purchase.purchasedAt;
        purchase.customer = resolvedCustomer;
        purchase.paymentMethod = dto.paymentMethod ?? purchase.paymentMethod;
        purchase.paymentType = paymentType;
        purchase.totalPrice = this.toMoney(totalPrice);
        purchase.paidNow = this.toMoney(paidNow);
        purchase.remaining = this.toMoney(remaining);
        purchase.notes = dto.notes ?? purchase.notes;

        await manager.getRepository(Purchase).save(purchase);
      });
    } catch (error) {
      if (error instanceof QueryFailedError) {
        const queryError = error as QueryFailedError & {
          detail?: string;
          message?: string;
        };
        throw new BadRequestException(
          queryError.detail ?? queryError.message ?? 'Database error while updating purchase',
        );
      }
      throw error;
    }

    const purchase = await this.getActivePurchaseWithItemsOrThrow(id);
    return toPurchaseDetailView(purchase);
  }

  private async getCurrentTotal(
    manager: EntityManager,
    purchaseId: number,
  ): Promise<number> {
    const rawTotal = await manager
      .getRepository(PurchaseItem)
      .createQueryBuilder('purchaseItem')
      .select('COALESCE(SUM(purchaseItem.purchasePrice), 0)', 'total')
      .where('purchaseItem.purchaseId = :purchaseId', { purchaseId })
      .andWhere('purchaseItem.isActive = :isActive', { isActive: true })
      .getRawOne<{ total: string }>();

    return this.parseNumeric(rawTotal?.total ?? 0);
  }

  private async applyItemsUpdate(
    manager: EntityManager,
    purchase: Purchase,
    items: UpdatePurchaseItemDto[],
  ): Promise<number> {
    this.ensureUniqueItemPayload(items);

    const purchaseItemsRepository = manager.getRepository(PurchaseItem);
    const inventoryRepository = manager.getRepository(InventoryItem);
    const now = new Date();

    const existing = await purchaseItemsRepository.find({
      where: { purchase: { id: purchase.id }, isActive: true },
      relations: { item: true },
      order: { id: 'ASC' },
    });

    const existingByItemId = new Map(existing.map((entry) => [entry.itemId, entry]));
    const keptItemIds = new Set<number>();

    for (const payload of items) {
      if (payload.itemId) {
        const existingItem = existingByItemId.get(payload.itemId);
        if (!existingItem) {
          throw new BadRequestException(
            `itemId ${payload.itemId} does not belong to purchase #${purchase.id}`,
          );
        }

        const inventory = existingItem.item;
        if (inventory.saleId || inventory.status === InventoryItemStatus.SOLD) {
          throw new ConflictException(
            `Cannot edit item ${inventory.id} because it is already sold`,
          );
        }

        const normalizedImei = payload.imei.trim();
        if (normalizedImei !== inventory.imei) {
          const existingByImei = await inventoryRepository.findOne({
            where: { imei: normalizedImei, isActive: true },
          });
          if (existingByImei && existingByImei.id !== inventory.id) {
            throw new ConflictException(
              `Inventory item with IMEI ${normalizedImei} already exists`,
            );
          }
        }

        this.assignInventoryFields(inventory, payload);
        inventory.purchase = purchase;
        await inventoryRepository.save(inventory);

        existingItem.purchasePrice = this.toMoney(this.parseNumeric(payload.purchasePrice));
        existingItem.notes = payload.knownIssues ?? existingItem.notes;
        await purchaseItemsRepository.save(existingItem);

        keptItemIds.add(inventory.id);
        continue;
      }

      const normalizedImei = payload.imei.trim();
      const existingByImei = await inventoryRepository.findOne({
        where: { imei: normalizedImei, isActive: true },
      });
      if (existingByImei) {
        throw new ConflictException(
          `Inventory item with IMEI ${normalizedImei} already exists`,
        );
      }

      const inventory = inventoryRepository.create({
        imei: normalizedImei,
        serialNumber: payload.serialNumber?.trim() || null,
        brand: payload.brand.trim(),
        model: payload.model.trim(),
        storage: payload.storage?.trim() || null,
        color: payload.color?.trim() || null,
        condition: payload.condition,
        knownIssues: payload.knownIssues?.trim() || null,
        status: this.resolveInitialStatus(payload.initialStatus, payload.condition),
        purchase,
        sale: null,
      });

      const savedInventory = await inventoryRepository.save(inventory);

      const purchaseItem = purchaseItemsRepository.create({
        purchase,
        item: savedInventory,
        purchasePrice: this.toMoney(this.parseNumeric(payload.purchasePrice)),
        notes: payload.knownIssues?.trim() || null,
      });

      await purchaseItemsRepository.save(purchaseItem);
      keptItemIds.add(savedInventory.id);
    }

    for (const oldItem of existing) {
      if (keptItemIds.has(oldItem.itemId)) {
        continue;
      }

      if (oldItem.item.saleId || oldItem.item.status === InventoryItemStatus.SOLD) {
        throw new ConflictException(
          `Cannot remove item ${oldItem.itemId} because it is already sold`,
        );
      }

      oldItem.isActive = false;
      oldItem.deletedAt = now;
      await purchaseItemsRepository.save(oldItem);

      oldItem.item.isActive = false;
      oldItem.item.deletedAt = now;
      await inventoryRepository.save(oldItem.item);
    }

    return items.reduce(
      (sum, item) => sum + this.parseNumeric(item.purchasePrice),
      0,
    );
  }

  private assignInventoryFields(
    inventory: InventoryItem,
    payload: UpdatePurchaseItemDto,
  ): void {
    inventory.imei = payload.imei.trim();
    inventory.serialNumber = payload.serialNumber?.trim() || null;
    inventory.brand = payload.brand.trim();
    inventory.model = payload.model.trim();
    inventory.storage = payload.storage?.trim() || null;
    inventory.color = payload.color?.trim() || null;
    inventory.condition = payload.condition;
    inventory.knownIssues = payload.knownIssues?.trim() || null;
    inventory.status = this.resolveInitialStatus(
      payload.initialStatus,
      payload.condition,
      inventory.status,
    );
  }

  private resolveInitialStatus(
    status: UpdatePurchaseItemDto['initialStatus'],
    condition: InventoryItemCondition,
    fallback: InventoryItemStatus = InventoryItemStatus.IN_STOCK,
  ): InventoryItemStatus {
    if (status === InitialPurchaseItemStatus.IN_REPAIR) {
      return InventoryItemStatus.IN_REPAIR;
    }

    if (status === InitialPurchaseItemStatus.IN_STOCK) {
      return InventoryItemStatus.IN_STOCK;
    }

    if (condition === InventoryItemCondition.BROKEN) {
      return InventoryItemStatus.IN_REPAIR;
    }

    return fallback;
  }

  private ensureUniqueItemPayload(items: UpdatePurchaseItemDto[]): void {
    const seenImei = new Set<string>();
    const seenIds = new Set<number>();

    for (const item of items) {
      const imei = item.imei.trim();
      if (seenImei.has(imei)) {
        throw new BadRequestException(`Duplicate IMEI in request: ${imei}`);
      }
      seenImei.add(imei);

      if (item.itemId) {
        if (seenIds.has(item.itemId)) {
          throw new BadRequestException(
            `Duplicate itemId in request: ${item.itemId}`,
          );
        }
        seenIds.add(item.itemId);
      }
    }
  }

  private async resolveCustomerForUpdate(
    manager: EntityManager,
    currentCustomerId: number | null,
    nextCustomerId: number | undefined,
    customerDto: UpdatePurchaseCustomerDto | undefined,
  ): Promise<Customer | null> {
    const customersRepository = manager.getRepository(Customer);

    let customer: Customer | null = null;

    if (nextCustomerId !== undefined) {
      customer = await this.getActiveCustomerOrThrow(nextCustomerId, manager);
    } else if (currentCustomerId) {
      customer =
        (await customersRepository.findOne({
          where: { id: currentCustomerId, isActive: true },
        })) ?? null;
    }

    if (!customerDto) {
      return customer;
    }

    const fullName = customerDto.fullName?.trim();
    const phoneNumber = customerDto.phoneNumber?.trim();

    if ((fullName && !phoneNumber) || (!fullName && phoneNumber)) {
      throw new BadRequestException(
        'customer.fullName and customer.phoneNumber must be provided together',
      );
    }

    if (!fullName || !phoneNumber) {
      return customer;
    }

    if (!customer) {
      const existingByPhone = await customersRepository.findOne({
        where: { phoneNumber, isActive: true },
      });
      customer = existingByPhone ?? null;
    }

    if (!customer) {
      const created = customersRepository.create({
        fullName,
        phoneNumber,
        address: customerDto.address?.trim() ?? null,
      });
      return customersRepository.save(created);
    }

    customer.fullName = fullName;
    customer.phoneNumber = phoneNumber;
    customer.address = customerDto.address?.trim() ?? customer.address;

    return customersRepository.save(customer);
  }
}
