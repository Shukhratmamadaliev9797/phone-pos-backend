import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CustomerEnsureService } from 'src/customer/services/customer-ensure.service';
import { Customer } from 'src/customer/entities/customer.entity';
import {
  InventoryItem,
  InventoryItemCondition,
  InventoryItemStatus,
} from 'src/inventory/entities/inventory-item.entity';
import {
  InventoryActivity,
  InventoryActivityType,
} from 'src/inventory/entities/inventory-activity.entity';
import { EntityManager, QueryFailedError, Repository } from 'typeorm';
import {
  CreatePurchaseCustomerDto,
  CreatePurchaseDto,
  InitialPurchaseItemStatus,
} from '../dto/create-purchase.dto';
import { PurchaseDetailViewDto } from '../dto/purchase-result.dto';
import { PurchaseActivity } from '../entities/purchase-activity.entity';
import { PurchaseItem } from '../entities/purchase-item.entity';
import { Purchase, PurchasePaymentType } from '../entities/purchase.entity';
import { toPurchaseDetailView } from '../helper';
import { PurchaseBaseService } from './purchase-base.service';
import { Repair, RepairStatus } from 'src/repair/entities/repair.entity';

@Injectable()
export class PurchaseCreateService extends PurchaseBaseService {
  private readonly logger = new Logger(PurchaseCreateService.name);
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
    private readonly customerEnsureService: CustomerEnsureService,
  ) {
    super(
      purchasesRepository,
      purchaseItemsRepository,
      inventoryItemsRepository,
      customersRepository,
      purchaseActivitiesRepository,
    );
  }

  async execute(dto: CreatePurchaseDto): Promise<PurchaseDetailViewDto> {
    const duplicateImei = this.findDuplicateImei(dto.items.map((item) => item.imei));
    if (duplicateImei) {
      throw new BadRequestException(`Duplicate IMEI in request: ${duplicateImei}`);
    }

    const totalPrice = dto.items.reduce(
      (acc, item) => acc + this.parseNumeric(item.purchasePrice),
      0,
    );

    const paidNow =
      dto.paymentType === PurchasePaymentType.PAID_NOW
        ? totalPrice
        : this.parseNumeric(dto.paidNow ?? 0);

    const remaining = totalPrice - paidNow;
    this.ensureNonNegativeRemaining(remaining);
    const requiresCustomer =
      dto.paymentType === PurchasePaymentType.PAY_LATER || remaining > 0;
    if (requiresCustomer && !dto.customerId && !dto.customer) {
      throw new BadRequestException(
        'Customer details are required for PAY_LATER or remaining balance',
      );
    }

    let createdId: number;

    try {
      createdId = await this.purchasesRepository.manager.transaction(
        async (manager) => {
          const customer = await this.resolveCustomerForPurchase(
            dto.customerId,
            dto.customer,
            manager,
          );

          for (const item of dto.items) {
            await this.ensureActiveImeiIsUnique(item.imei, manager);
          }

          const purchaseRepository = manager.getRepository(Purchase);
          const purchaseItemRepository = manager.getRepository(PurchaseItem);
          const inventoryItemRepository = manager.getRepository(InventoryItem);
          const purchaseActivityRepository =
            manager.getRepository(PurchaseActivity);

          const purchase = purchaseRepository.create({
            purchasedAt: this.parseDateOrNow(dto.purchasedAt),
            customer,
            paymentMethod: dto.paymentMethod,
            paymentType: dto.paymentType,
            totalPrice: this.toMoney(totalPrice),
            paidNow: this.toMoney(paidNow),
            remaining: this.toMoney(remaining),
            notes: dto.notes ?? null,
          });

          const savedPurchase = await purchaseRepository.save(purchase);

          for (const item of dto.items) {
            const initialStatus = this.resolveInitialStatus(
              item.initialStatus,
              item.condition,
            );
            const inventory = inventoryItemRepository.create({
              imei: item.imei,
              serialNumber: item.serialNumber ?? null,
              brand: item.brand,
              model: item.model,
              storage: item.storage ?? null,
              color: item.color ?? null,
              condition: item.condition,
              knownIssues: item.knownIssues ?? null,
              status: initialStatus,
              purchase: savedPurchase,
              sale: null,
            });

            const savedInventory = await inventoryItemRepository.save(inventory);
            await manager.getRepository(InventoryActivity).save(
              manager.getRepository(InventoryActivity).create({
                item: savedInventory,
                type: InventoryActivityType.PURCHASED,
                fromStatus: null,
                toStatus: initialStatus,
                notes: `Phone purchased for ${this.toMoney(
                  this.parseNumeric(item.purchasePrice),
                )}`,
              }),
            );

            const purchaseItem = purchaseItemRepository.create({
              purchase: savedPurchase,
              item: savedInventory,
              purchasePrice: this.toMoney(this.parseNumeric(item.purchasePrice)),
              notes: null,
            });

            await purchaseItemRepository.save(purchaseItem);

            if (initialStatus === InventoryItemStatus.IN_REPAIR) {
              const autoDescription =
                item.knownIssues?.trim() ||
                `${item.brand} ${item.model} requires inspection/repair`;

              const autoRepair = manager.getRepository(Repair).create({
                item: savedInventory,
                repairedAt: savedPurchase.purchasedAt,
                description: autoDescription,
                status: RepairStatus.PENDING,
                costTotal: this.toMoney(0),
                partsCost: null,
                laborCost: null,
                technician: null,
                notes: `Auto-created from purchase #${savedPurchase.id}`,
              });

              await manager.getRepository(Repair).save(autoRepair);
            }
          }

          if (paidNow > 0) {
            const activity = purchaseActivityRepository.create({
              purchase: savedPurchase,
              paidAt: savedPurchase.purchasedAt,
              amount: this.toMoney(paidNow),
              notes:
                remaining <= 0 ? "To'liq to'landi" : 'Initial partial payment',
            });
            await purchaseActivityRepository.save(activity);
          }

          return savedPurchase.id;
        },
      );
    } catch (error) {
      this.logger.error('Purchase create failed', error as Error);

      if (error instanceof QueryFailedError) {
        const queryError = error as QueryFailedError & {
          code?: string;
          detail?: string;
          constraint?: string;
        };

        if (queryError.code === '23505') {
          throw new BadRequestException(
            queryError.detail ?? 'Duplicate key violation while creating purchase',
          );
        }

        if (queryError.code === '23503') {
          throw new BadRequestException(
            queryError.detail ?? 'Invalid reference while creating purchase',
          );
        }

        throw new BadRequestException(
          queryError.detail ?? queryError.message ?? 'Database error while creating purchase',
        );
      }

      if (error instanceof Error) {
        throw new BadRequestException(error.message);
      }

      throw error;
    }

    const purchase = await this.getActivePurchaseWithItemsOrThrow(createdId);
    return toPurchaseDetailView(purchase);
  }

  private async resolveCustomerForPurchase(
    customerId: number | undefined,
    customerDto: CreatePurchaseCustomerDto | undefined,
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

  private findDuplicateImei(imeis: string[]): string | null {
    const seen = new Set<string>();
    for (const imei of imeis) {
      const normalized = imei.trim();
      if (seen.has(normalized)) {
        return normalized;
      }
      seen.add(normalized);
    }

    return null;
  }

  private resolveInitialStatus(
    initialStatus: InitialPurchaseItemStatus | undefined,
    condition: InventoryItemCondition,
  ): InventoryItemStatus {
    if (initialStatus === InitialPurchaseItemStatus.IN_REPAIR) {
      return InventoryItemStatus.IN_REPAIR;
    }

    if (initialStatus === InitialPurchaseItemStatus.READY_FOR_SALE) {
      return InventoryItemStatus.READY_FOR_SALE;
    }

    if (condition === InventoryItemCondition.BROKEN) {
      return InventoryItemStatus.IN_REPAIR;
    }

    return InventoryItemStatus.READY_FOR_SALE;
  }
}
