import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Customer } from 'src/customer/entities/customer.entity';
import { InventoryItem } from 'src/inventory/entities/inventory-item.entity';
import { EntityManager, Repository } from 'typeorm';
import { PurchaseActivity } from '../entities/purchase-activity.entity';
import { PurchaseItem } from '../entities/purchase-item.entity';
import { Purchase, PurchasePaymentType } from '../entities/purchase.entity';

@Injectable()
export class PurchaseBaseService {
  constructor(
    @InjectRepository(Purchase)
    protected readonly purchasesRepository: Repository<Purchase>,
    @InjectRepository(PurchaseItem)
    protected readonly purchaseItemsRepository: Repository<PurchaseItem>,
    @InjectRepository(InventoryItem)
    protected readonly inventoryItemsRepository: Repository<InventoryItem>,
    @InjectRepository(Customer)
    protected readonly customersRepository: Repository<Customer>,
    @InjectRepository(PurchaseActivity)
    protected readonly purchaseActivitiesRepository: Repository<PurchaseActivity>,
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

  protected async ensureActiveImeiIsUnique(
    imei: string,
    manager?: EntityManager,
  ): Promise<void> {
    const repository = manager
      ? manager.getRepository(InventoryItem)
      : this.inventoryItemsRepository;

    const existing = await repository.findOne({
      where: { imei },
      select: { id: true, isActive: true },
    });

    if (existing) {
      throw new ConflictException(
        existing.isActive
          ? `Inventory item with IMEI ${imei} already exists`
          : `Inventory item with IMEI ${imei} already exists (inactive record)`,
      );
    }
  }

  protected async getActivePurchaseOrThrow(
    id: number,
    manager?: EntityManager,
  ): Promise<Purchase> {
    const repository = manager
      ? manager.getRepository(Purchase)
      : this.purchasesRepository;

    const purchase = await repository.findOne({
      where: { id, isActive: true },
    });

    if (!purchase) {
      throw new NotFoundException('Purchase not found');
    }

    return purchase;
  }

  protected async getActivePurchaseWithItemsOrThrow(
    id: number,
    manager?: EntityManager,
  ): Promise<Purchase> {
    const repository = manager
      ? manager.getRepository(Purchase)
      : this.purchasesRepository;

    const purchase = await repository
      .createQueryBuilder('purchase')
      .leftJoinAndSelect('purchase.customer', 'customer')
      .leftJoinAndSelect(
        'purchase.items',
        'purchaseItem',
        'purchaseItem.isActive = :purchaseItemIsActive',
        { purchaseItemIsActive: true },
      )
      .leftJoinAndSelect(
        'purchase.activities',
        'purchaseActivity',
        'purchaseActivity.isActive = :purchaseActivityIsActive',
        { purchaseActivityIsActive: true },
      )
      .leftJoinAndSelect(
        'purchaseItem.item',
        'inventoryItem',
        'inventoryItem.isActive = :inventoryItemIsActive',
        { inventoryItemIsActive: true },
      )
      .where('purchase.id = :id', { id })
      .andWhere('purchase.isActive = :isActive', { isActive: true })
      .orderBy('purchaseItem.id', 'ASC')
      .addOrderBy('purchaseActivity.paidAt', 'ASC')
      .addOrderBy('purchaseActivity.id', 'ASC')
      .getOne();

    if (!purchase) {
      throw new NotFoundException('Purchase not found');
    }

    return purchase;
  }

  protected ensureNonNegativeRemaining(remaining: number): void {
    if (remaining < 0) {
      throw new BadRequestException('paidNow cannot be greater than totalPrice');
    }
  }

  protected ensureCustomerRequirement(
    paymentType: PurchasePaymentType,
    customerId: number | undefined,
    remaining: number,
  ): void {
    const requiresCustomer =
      paymentType === PurchasePaymentType.PAY_LATER || remaining > 0;

    if (requiresCustomer && !customerId) {
      throw new BadRequestException(
        'customerId is required for PAY_LATER or remaining balance',
      );
    }
  }
}
