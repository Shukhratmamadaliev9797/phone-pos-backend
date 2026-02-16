import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Customer } from 'src/customer/entities/customer.entity';
import {
  InventoryItem,
  InventoryItemStatus,
} from 'src/inventory/entities/inventory-item.entity';
import { EntityManager, Repository } from 'typeorm';
import { SaleActivity } from '../entities/sale-activity.entity';
import { SaleItem } from '../entities/sale-item.entity';
import { Sale, SalePaymentType } from '../entities/sale.entity';

@Injectable()
export class SaleBaseService {
  protected static readonly MAX_MONEY_ABS = 9_999_999_999.99;

  constructor(
    @InjectRepository(Sale)
    protected readonly salesRepository: Repository<Sale>,
    @InjectRepository(SaleItem)
    protected readonly saleItemsRepository: Repository<SaleItem>,
    @InjectRepository(InventoryItem)
    protected readonly inventoryItemsRepository: Repository<InventoryItem>,
    @InjectRepository(Customer)
    protected readonly customersRepository: Repository<Customer>,
    @InjectRepository(SaleActivity)
    protected readonly saleActivitiesRepository: Repository<SaleActivity>,
  ) {}

  protected toMoney(value: number): string {
    return value.toFixed(2);
  }

  protected parseNumeric(value: string | number): number {
    const numeric = typeof value === 'string' ? Number(value) : value;
    if (!Number.isFinite(numeric)) {
      throw new BadRequestException('Numeric value is invalid');
    }
    return numeric;
  }

  protected ensureMoneyFitsPrecision(value: number, field: string): number {
    const rounded = Math.round((value + Number.EPSILON) * 100) / 100;
    if (Math.abs(rounded) >= 10_000_000_000) {
      throw new BadRequestException(
        `${field} is too large. Max allowed is ${SaleBaseService.MAX_MONEY_ABS}.`,
      );
    }
    return rounded;
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

  protected ensureNonNegativeRemaining(remaining: number): void {
    if (remaining < 0) {
      throw new BadRequestException('paidNow cannot be greater than totalPrice');
    }
  }

  protected ensureCustomerRequirement(
    paymentType: SalePaymentType,
    customerId: number | undefined,
    remaining: number,
  ): void {
    const requiresCustomer =
      paymentType === SalePaymentType.PAY_LATER || remaining > 0;

    if (requiresCustomer && !customerId) {
      throw new BadRequestException(
        'customerId is required for PAY_LATER or remaining balance',
      );
    }
  }

  protected async getActiveCustomerOrThrow(
    id: number,
    manager?: EntityManager,
  ): Promise<Customer> {
    const repository = manager
      ? manager.getRepository(Customer)
      : this.customersRepository;

    const customer = await repository.findOne({
      where: { id, isActive: true },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    return customer;
  }

  protected async getActiveSaleOrThrow(
    id: number,
    manager?: EntityManager,
  ): Promise<Sale> {
    const repository = manager ? manager.getRepository(Sale) : this.salesRepository;
    const sale = await repository.findOne({ where: { id, isActive: true } });

    if (!sale) {
      throw new NotFoundException('Sale not found');
    }

    return sale;
  }

  protected async getActiveSaleWithItemsOrThrow(
    id: number,
    manager?: EntityManager,
  ): Promise<Sale> {
    const repository = manager ? manager.getRepository(Sale) : this.salesRepository;

    const sale = await repository
      .createQueryBuilder('sale')
      .leftJoinAndSelect('sale.customer', 'customer')
      .leftJoinAndSelect(
        'sale.items',
        'saleItem',
        'saleItem.isActive = :saleItemIsActive',
        { saleItemIsActive: true },
      )
      .leftJoinAndSelect(
        'sale.activities',
        'saleActivity',
        'saleActivity.isActive = :saleActivityIsActive',
        { saleActivityIsActive: true },
      )
      .leftJoinAndSelect(
        'saleItem.item',
        'inventoryItem',
        'inventoryItem.isActive = :inventoryItemIsActive',
        { inventoryItemIsActive: true },
      )
      .where('sale.id = :id', { id })
      .andWhere('sale.isActive = :isActive', { isActive: true })
      .orderBy('saleItem.id', 'ASC')
      .addOrderBy('saleActivity.paidAt', 'ASC')
      .addOrderBy('saleActivity.id', 'ASC')
      .getOne();

    if (!sale) {
      throw new NotFoundException('Sale not found');
    }

    return sale;
  }

  protected async getActiveInventoryItemByIdOrThrow(
    id: number,
    manager?: EntityManager,
  ): Promise<InventoryItem> {
    const repository = manager
      ? manager.getRepository(InventoryItem)
      : this.inventoryItemsRepository;

    const item = await repository.findOne({
      where: { id, isActive: true },
    });

    if (!item) {
      throw new NotFoundException(`Inventory item ${id} not found`);
    }

    return item;
  }

  protected async getActiveInventoryItemByImeiOrThrow(
    imei: string,
    manager?: EntityManager,
  ): Promise<InventoryItem> {
    const repository = manager
      ? manager.getRepository(InventoryItem)
      : this.inventoryItemsRepository;

    const item = await repository.findOne({
      where: { imei, isActive: true },
    });

    if (!item) {
      throw new NotFoundException(`Inventory item with IMEI ${imei} not found`);
    }

    return item;
  }

  protected async resolveActiveInventoryItemOrThrow(
    itemId: number | undefined,
    imei: string | undefined,
    manager?: EntityManager,
  ): Promise<InventoryItem> {
    if (!itemId && !imei) {
      throw new BadRequestException('Each sale item must include itemId or imei');
    }

    if (itemId && imei) {
      const item = await this.getActiveInventoryItemByIdOrThrow(itemId, manager);
      if (item.imei !== imei) {
        throw new BadRequestException(
          `Inventory item ${itemId} does not match IMEI ${imei}`,
        );
      }
      return item;
    }

    if (itemId) {
      return this.getActiveInventoryItemByIdOrThrow(itemId, manager);
    }

    return this.getActiveInventoryItemByImeiOrThrow(imei as string, manager);
  }

  protected ensureSellableItem(item: InventoryItem): void {
    if (item.saleId || item.status === InventoryItemStatus.SOLD) {
      throw new ConflictException(`Inventory item ${item.id} is already sold`);
    }
  }
}
