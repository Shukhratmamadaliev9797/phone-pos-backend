import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Customer } from 'src/customer/entities/customer.entity';
import {
  InventoryItem,
  InventoryItemStatus,
} from 'src/inventory/entities/inventory-item.entity';
import { EntityManager, QueryFailedError, Repository } from 'typeorm';
import { SaleDetailViewDto } from '../dto/sale-result.dto';
import { SaleActivity } from '../entities/sale-activity.entity';
import {
  UpdateSaleCustomerDto,
  UpdateSaleDto,
  UpdateSaleItemDto,
} from '../dto/update-sale.dto';
import { SaleItem } from '../entities/sale-item.entity';
import { Sale, SalePaymentType } from '../entities/sale.entity';
import { toSaleDetailView } from '../helper';
import { SaleBaseService } from './sale-base.service';

@Injectable()
export class SaleUpdateService extends SaleBaseService {
  constructor(
    @InjectRepository(Sale)
    salesRepository: Repository<Sale>,
    @InjectRepository(SaleItem)
    saleItemsRepository: Repository<SaleItem>,
    @InjectRepository(InventoryItem)
    inventoryItemsRepository: Repository<InventoryItem>,
    @InjectRepository(Customer)
    customersRepository: Repository<Customer>,
    @InjectRepository(SaleActivity)
    saleActivitiesRepository: Repository<SaleActivity>,
  ) {
    super(
      salesRepository,
      saleItemsRepository,
      inventoryItemsRepository,
      customersRepository,
      saleActivitiesRepository,
    );
  }

  async execute(id: number, dto: UpdateSaleDto): Promise<SaleDetailViewDto> {
    try {
      await this.salesRepository.manager.transaction(async (manager) => {
        const sale = await this.getActiveSaleOrThrow(id, manager);
        const totalPrice =
          dto.items && dto.items.length > 0
            ? await this.applyItemsUpdate(sale, dto.items, manager)
            : await this.getSaleTotal(sale.id, manager);
        this.ensureMoneyFitsPrecision(totalPrice, 'totalPrice');
        const paymentType = dto.paymentType ?? sale.paymentType;
        const installmentMonths =
          paymentType === SalePaymentType.PAY_LATER
            ? Math.max(1, dto.installmentMonths ?? sale.installmentMonths ?? 1)
            : null;
        const monthlyInstallmentAmount =
          paymentType === SalePaymentType.PAY_LATER
            ? this.ensureMoneyFitsPrecision(
                this.roundMoney(totalPrice / Math.max(1, installmentMonths ?? 1)),
                'monthlyInstallmentAmount',
              )
            : null;
        const firstPaymentNow =
          paymentType === SalePaymentType.PAY_LATER
            ? (dto.firstPaymentNow ?? sale.firstPaymentNow ?? true)
            : null;
        const paidNow =
          paymentType === SalePaymentType.PAID_NOW
            ? totalPrice
            : firstPaymentNow
              ? monthlyInstallmentAmount ?? 0
              : 0;
        this.ensureMoneyFitsPrecision(paidNow, 'paidNow');

        if (paymentType === SalePaymentType.PAID_NOW && paidNow < totalPrice) {
          throw new BadRequestException(
            'PAID_NOW requires paidNow to equal totalPrice',
          );
        }

        const remaining = totalPrice - paidNow;
        this.ensureNonNegativeRemaining(remaining);
        this.ensureMoneyFitsPrecision(remaining, 'remaining');

        const customer = await this.resolveCustomerForUpdate(
          manager,
          sale.customerId ?? null,
          dto.customerId,
          dto.customer,
        );

        sale.soldAt = dto.soldAt ? this.parseDateOrNow(dto.soldAt) : sale.soldAt;
        sale.customer = customer;
        sale.paymentMethod = dto.paymentMethod ?? sale.paymentMethod;
        sale.paymentType = paymentType;
        sale.totalPrice = this.toMoney(totalPrice);
        sale.paidNow = this.toMoney(paidNow);
        sale.remaining = this.toMoney(remaining);
        sale.installmentMonths = installmentMonths;
        sale.firstPaymentNow = firstPaymentNow;
        sale.monthlyInstallmentAmount =
          monthlyInstallmentAmount !== null
            ? this.toMoney(monthlyInstallmentAmount)
            : null;
        sale.notes = dto.notes ?? sale.notes;

        await manager.getRepository(Sale).save(sale);

        await this.keepOnlyFirstPaymentActivity(sale.id, manager, sale);
      });
    } catch (error) {
      if (error instanceof QueryFailedError) {
        const queryError = error as QueryFailedError & {
          detail?: string;
          message?: string;
        };
        throw new BadRequestException(
          queryError.detail ?? queryError.message ?? 'Database error while updating sale',
        );
      }
      throw error;
    }

    const sale = await this.getActiveSaleWithItemsOrThrow(id);
    return toSaleDetailView(sale);
  }

  private roundMoney(value: number): number {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  }

  private async keepOnlyFirstPaymentActivity(
    saleId: number,
    manager: EntityManager,
    sale: Sale,
  ): Promise<void> {
    const activities = await manager.getRepository(SaleActivity).find({
      where: {
        sale: { id: saleId },
        isActive: true,
      },
      order: {
        paidAt: 'ASC',
        id: 'ASC',
      },
    });

    if (activities.length <= 1) {
      return;
    }

    const firstActivity = activities[0];
    const removable = activities.slice(1);
    const now = new Date();

    for (const activity of removable) {
      activity.isActive = false;
      activity.deletedAt = now;
    }
    await manager.getRepository(SaleActivity).save(removable);

    const firstAmount = this.parseNumeric(firstActivity.amount);
    const total = this.parseNumeric(sale.totalPrice);
    const nextPaidNow = Math.min(Math.max(firstAmount, 0), total);
    const nextRemaining = total - nextPaidNow;

    sale.paidNow = this.toMoney(nextPaidNow);
    sale.remaining = this.toMoney(nextRemaining);
    sale.paymentType =
      nextRemaining <= 0 ? SalePaymentType.PAID_NOW : SalePaymentType.PAY_LATER;

    await manager.getRepository(Sale).save(sale);
  }

  private async getSaleTotal(
    saleId: number,
    manager: EntityManager,
  ): Promise<number> {
    const rawTotal = await manager
      .getRepository(SaleItem)
      .createQueryBuilder('saleItem')
      .select('COALESCE(SUM(saleItem.salePrice), 0)', 'total')
      .where('saleItem.saleId = :saleId', { saleId })
      .andWhere('saleItem.isActive = :isActive', { isActive: true })
      .getRawOne<{ total: string }>();

    return this.parseNumeric(rawTotal?.total ?? 0);
  }

  private async applyItemsUpdate(
    sale: Sale,
    items: UpdateSaleItemDto[],
    manager: EntityManager,
  ): Promise<number> {
    this.ensureNoDuplicateItems(items);

    const saleItemsRepository = manager.getRepository(SaleItem);
    const inventoryRepository = manager.getRepository(InventoryItem);

    const existing = await saleItemsRepository.find({
      where: {
        sale: { id: sale.id },
        isActive: true,
      },
      relations: { item: true },
      order: { id: 'ASC' },
    });

    const existingByItemId = new Map(existing.map((entry) => [entry.itemId, entry]));
    const targetItemIds: number[] = [];

    for (const itemDto of items) {
      const inventory = await this.resolveActiveInventoryItemOrThrow(
        itemDto.itemId,
        itemDto.imei,
        manager,
      );

      if (!existingByItemId.has(inventory.id)) {
        this.ensureSellableItem(inventory);
      }

      targetItemIds.push(inventory.id);

      const current = existingByItemId.get(inventory.id);
      if (current) {
        const salePriceNumber = this.ensureMoneyFitsPrecision(
          this.parseNumeric(itemDto.salePrice),
          'items.salePrice',
        );
        current.salePrice = this.toMoney(salePriceNumber);
        current.notes = itemDto.notes ?? null;
        await saleItemsRepository.save(current);
      } else {
        const salePrice = this.toMoney(
          this.ensureMoneyFitsPrecision(
            this.parseNumeric(itemDto.salePrice),
            'items.salePrice',
          ),
        );
        const existingAny = await saleItemsRepository
          .createQueryBuilder('saleItem')
          .where('saleItem.itemId = :itemId', { itemId: inventory.id })
          .orderBy('saleItem.id', 'DESC')
          .getOne();

        if (existingAny) {
          existingAny.sale = sale;
          existingAny.item = inventory;
          existingAny.salePrice = salePrice;
          existingAny.notes = itemDto.notes ?? null;
          existingAny.isActive = true;
          existingAny.deletedAt = null;
          await saleItemsRepository.save(existingAny);
        } else {
          const created = saleItemsRepository.create({
            sale,
            item: inventory,
            salePrice,
            notes: itemDto.notes ?? null,
          });
          await saleItemsRepository.save(created);
        }
      }

      inventory.status = InventoryItemStatus.SOLD;
      inventory.sale = sale;
      await inventoryRepository.save(inventory);
    }

    const now = new Date();
    for (const entry of existing) {
      if (targetItemIds.includes(entry.itemId)) {
        continue;
      }

      entry.isActive = false;
      entry.deletedAt = now;
      await saleItemsRepository.save(entry);

      const inventory = entry.item;
      inventory.sale = null;
      if (inventory.status === InventoryItemStatus.SOLD) {
        inventory.status = InventoryItemStatus.IN_STOCK;
      }
      await inventoryRepository.save(inventory);
    }

    return items.reduce((sum, item) => {
      const salePrice = this.ensureMoneyFitsPrecision(
        this.parseNumeric(item.salePrice),
        'items.salePrice',
      );
      const next = sum + salePrice;
      this.ensureMoneyFitsPrecision(next, 'totalPrice');
      return next;
    }, 0);
  }

  private ensureNoDuplicateItems(items: UpdateSaleItemDto[]): void {
    const ids = new Set<number>();
    const imeis = new Set<string>();

    for (const item of items) {
      if (item.itemId) {
        if (ids.has(item.itemId)) {
          throw new BadRequestException(`Duplicate itemId in request: ${item.itemId}`);
        }
        ids.add(item.itemId);
      }

      if (item.imei) {
        const normalized = item.imei.trim();
        if (imeis.has(normalized)) {
          throw new BadRequestException(`Duplicate IMEI in request: ${normalized}`);
        }
        imeis.add(normalized);
      }
    }
  }

  private async resolveCustomerForUpdate(
    manager: EntityManager,
    currentCustomerId: number | null,
    nextCustomerId: number | undefined,
    customerDto: UpdateSaleCustomerDto | undefined,
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
