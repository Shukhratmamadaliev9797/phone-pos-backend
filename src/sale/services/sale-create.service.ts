import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CustomerEnsureService } from 'src/customer/services/customer-ensure.service';
import { Customer } from 'src/customer/entities/customer.entity';
import { InventoryItem, InventoryItemStatus } from 'src/inventory/entities/inventory-item.entity';
import {
  InventoryActivity,
  InventoryActivityType,
} from 'src/inventory/entities/inventory-activity.entity';
import { EntityManager, QueryFailedError, Repository } from 'typeorm';
import { CreateSaleCustomerDto, CreateSaleDto } from '../dto/create-sale.dto';
import { SaleDetailViewDto } from '../dto/sale-result.dto';
import { SaleItem } from '../entities/sale-item.entity';
import { SaleActivity } from '../entities/sale-activity.entity';
import { Sale, SalePaymentType } from '../entities/sale.entity';
import { toSaleDetailView } from '../helper';
import { SaleBaseService } from './sale-base.service';

@Injectable()
export class SaleCreateService extends SaleBaseService {
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
    private readonly customerEnsureService: CustomerEnsureService,
  ) {
    super(
      salesRepository,
      saleItemsRepository,
      inventoryItemsRepository,
      customersRepository,
      saleActivitiesRepository,
    );
  }

  async execute(dto: CreateSaleDto): Promise<SaleDetailViewDto> {
    this.ensureNoDuplicateItemReferences(dto);

    const totalPrice = dto.items.reduce(
      (acc, item) => acc + this.parseNumeric(item.salePrice),
      0,
    );

    const paidNow =
      dto.paymentType === SalePaymentType.PAID_NOW
        ? totalPrice
        : this.parseNumeric(dto.paidNow ?? 0);

    const remaining = totalPrice - paidNow;
    this.ensureNonNegativeRemaining(remaining);
    const requiresCustomer =
      dto.paymentType === SalePaymentType.PAY_LATER || remaining > 0;
    if (requiresCustomer && !dto.customerId && !dto.customer) {
      throw new BadRequestException(
        'Customer details are required for PAY_LATER or remaining balance',
      );
    }

    let createdId: number;

    try {
      createdId = await this.salesRepository.manager.transaction(async (manager) => {
        const customer = await this.resolveCustomerForSale(
          dto.customerId,
          dto.customer,
          manager,
        );

        const saleRepository = manager.getRepository(Sale);
        const saleItemRepository = manager.getRepository(SaleItem);
        const inventoryRepository = manager.getRepository(InventoryItem);
        const saleActivitiesRepository = manager.getRepository(SaleActivity);

        const sale = saleRepository.create({
          soldAt: this.parseDateOrNow(dto.soldAt),
          customer,
          paymentMethod: dto.paymentMethod,
          paymentType: dto.paymentType,
          totalPrice: this.toMoney(totalPrice),
          paidNow: this.toMoney(paidNow),
          remaining: this.toMoney(remaining),
          notes: dto.notes ?? null,
        });

        const savedSale = await saleRepository.save(sale);

        for (const itemDto of dto.items) {
          const inventory = await this.resolveActiveInventoryItemOrThrow(
            itemDto.itemId,
            itemDto.imei?.trim(),
            manager,
          );
          this.ensureSellableItem(inventory);

          const saleItem = saleItemRepository.create({
            sale: savedSale,
            item: inventory,
            salePrice: this.toMoney(this.parseNumeric(itemDto.salePrice)),
            notes: itemDto.notes ?? null,
          });

          await saleItemRepository.save(saleItem);

          const previousStatus = inventory.status;
          inventory.status = InventoryItemStatus.SOLD;
          inventory.sale = savedSale;
          await inventoryRepository.save(inventory);
          await manager.getRepository(InventoryActivity).save(
            manager.getRepository(InventoryActivity).create({
              item: inventory,
              type: InventoryActivityType.SOLD,
              fromStatus: previousStatus,
              toStatus: InventoryItemStatus.SOLD,
              notes: `Phone sold for ${this.toMoney(
                this.parseNumeric(itemDto.salePrice),
              )}`,
            }),
          );
        }

        if (paidNow > 0) {
          const activity = saleActivitiesRepository.create({
            sale: savedSale,
            paidAt: savedSale.soldAt,
            amount: this.toMoney(paidNow),
            notes: 'Initial payment',
          });
          await saleActivitiesRepository.save(activity);
        }

        return savedSale.id;
      });
    } catch (error) {
      if (error instanceof QueryFailedError) {
        const queryError = error as QueryFailedError & {
          code?: string;
          detail?: string;
          constraint?: string;
        };

        if (queryError.code === '23505') {
          throw new ConflictException(
            queryError.detail ?? 'Sale item already exists for one of the items',
          );
        }

        throw new BadRequestException(
          queryError.detail ?? queryError.message ?? 'Database error while creating sale',
        );
      }
      throw error;
    }

    const sale = await this.getActiveSaleWithItemsOrThrow(createdId);
    return toSaleDetailView(sale);
  }

  private async resolveCustomerForSale(
    customerId: number | undefined,
    customerDto: CreateSaleCustomerDto | undefined,
    manager: EntityManager,
  ): Promise<Customer | null> {
    if (customerId) {
      return this.getActiveCustomerOrThrow(customerId, manager);
    }

    if (!customerDto) {
      return null;
    }
    return this.customerEnsureService.ensureCustomer(
      {
        phoneNumber: customerDto.phoneNumber,
        fullName: customerDto.fullName,
        address: customerDto.address,
        passportId: customerDto.passportId,
        notes: customerDto.notes,
      },
      manager,
    );
  }

  private ensureNoDuplicateItemReferences(dto: CreateSaleDto): void {
    const seenItemIds = new Set<number>();
    const seenImeis = new Set<string>();

    for (const item of dto.items) {
      if (item.itemId) {
        if (seenItemIds.has(item.itemId)) {
          throw new BadRequestException(
            `Duplicate itemId in request: ${item.itemId}`,
          );
        }
        seenItemIds.add(item.itemId);
      }

      if (item.imei) {
        const normalized = item.imei.trim();
        if (seenImeis.has(normalized)) {
          throw new BadRequestException(`Duplicate IMEI in request: ${normalized}`);
        }
        seenImeis.add(normalized);
      }
    }
  }
}
