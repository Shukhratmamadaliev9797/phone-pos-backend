import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CustomerEnsureService } from 'src/customer/services/customer-ensure.service';
import { Customer } from 'src/customer/entities/customer.entity';
import { InventoryItem, InventoryItemStatus } from 'src/inventory/entities/inventory-item.entity';
import { Worker, WorkerSalaryType } from 'src/worker/entities/worker.entity';
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
      (acc, item) =>
        acc +
        this.ensureMoneyFitsPrecision(
          this.parseNumeric(item.salePrice),
          'items.salePrice',
        ),
      0,
    );
    this.ensureMoneyFitsPrecision(totalPrice, 'totalPrice');

    const installmentMonths =
      dto.paymentType === SalePaymentType.PAY_LATER
        ? Math.max(1, dto.installmentMonths ?? 1)
        : null;
    const monthlyInstallmentAmount =
      dto.paymentType === SalePaymentType.PAY_LATER
        ? this.ensureMoneyFitsPrecision(
            this.roundMoney(totalPrice / Math.max(1, installmentMonths ?? 1)),
            'monthlyInstallmentAmount',
          )
        : null;
    const firstPaymentNow =
      dto.paymentType === SalePaymentType.PAY_LATER
        ? dto.firstPaymentNow ?? true
        : null;
    const paidNow =
      dto.paymentType === SalePaymentType.PAID_NOW
        ? totalPrice
        : firstPaymentNow
          ? monthlyInstallmentAmount ?? 0
          : this.ensureMoneyFitsPrecision(
              this.parseNumeric(dto.paidNow ?? 0),
              'paidNow',
            );
    this.ensureMoneyFitsPrecision(paidNow, 'paidNow');

    const remaining = totalPrice - paidNow;
    this.ensureNonNegativeRemaining(remaining);
    this.ensureMoneyFitsPrecision(remaining, 'remaining');
    const saleProfit = this.ensureMoneyFitsPrecision(
      this.parseNumeric(dto.profit ?? 0),
      'profit',
    );

    let createdId: number;

    try {
      createdId = await this.salesRepository.manager.transaction(async (manager) => {
        const customer = await this.resolveCustomerForSale(
          dto.customerId,
          dto.customer,
          manager,
        );
        const sellerWorker = await this.resolveSellerWorkerForSale(
          dto.sellerWorkerId,
          manager,
        );

        const saleRepository = manager.getRepository(Sale);
        const saleItemRepository = manager.getRepository(SaleItem);
        const inventoryRepository = manager.getRepository(InventoryItem);
        const saleActivitiesRepository = manager.getRepository(SaleActivity);
        const workerRepository = manager.getRepository(Worker);

        const sale = saleRepository.create({
          soldAt: this.parseDateOrNow(dto.soldAt),
          customer,
          sellerWorker,
          paymentMethod: dto.paymentMethod,
          paymentType: dto.paymentType,
          totalPrice: this.toMoney(totalPrice),
          paidNow: this.toMoney(paidNow),
          remaining: this.toMoney(remaining),
          installmentMonths,
          firstPaymentNow,
          monthlyInstallmentAmount:
            monthlyInstallmentAmount !== null
              ? this.toMoney(monthlyInstallmentAmount)
              : null,
          profit:
            dto.profit !== undefined
              ? this.toMoney(this.parseNumeric(dto.profit))
              : null,
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

          const salePriceNumber = this.ensureMoneyFitsPrecision(
            this.parseNumeric(itemDto.salePrice),
            'items.salePrice',
          );
          const salePrice = this.toMoney(salePriceNumber);
          const existingAny = await saleItemRepository
            .createQueryBuilder('saleItem')
            .where('saleItem.itemId = :itemId', { itemId: inventory.id })
            .orderBy('saleItem.id', 'DESC')
            .getOne();

          if (existingAny && existingAny.isActive) {
            throw new ConflictException(
              `Sale item for inventory item ${inventory.id} already exists`,
            );
          }

          if (existingAny) {
            existingAny.sale = savedSale;
            existingAny.item = inventory;
            existingAny.salePrice = salePrice;
            existingAny.notes = itemDto.notes ?? null;
            existingAny.isActive = true;
            existingAny.deletedAt = null;
            await saleItemRepository.save(existingAny);
          } else {
            const saleItem = saleItemRepository.create({
              sale: savedSale,
              item: inventory,
              salePrice,
              notes: itemDto.notes ?? null,
            });

            await saleItemRepository.save(saleItem);
          }

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
                salePriceNumber,
              )}`,
            }),
          );
        }

        if (sellerWorker) {
          const soldCountIncrement = dto.items.length;
          const previousSoldCount = Number(sellerWorker.soldPhonesCount ?? 0);
          const previousTotalSoldAmount = this.parseNumeric(
            sellerWorker.totalSoldAmount ?? 0,
          );
          const previousTotalProfitAmount = this.parseNumeric(
            sellerWorker.totalProfitAmount ?? 0,
          );
          const previousPercentSalary = this.parseNumeric(
            sellerWorker.percentSalaryAccrued ?? 0,
          );

          sellerWorker.soldPhonesCount = previousSoldCount + soldCountIncrement;
          sellerWorker.totalSoldAmount = this.toMoney(
            previousTotalSoldAmount + totalPrice,
          );
          sellerWorker.totalProfitAmount = this.toMoney(
            previousTotalProfitAmount + saleProfit,
          );

          if (sellerWorker.salaryType === WorkerSalaryType.PERCENT) {
            const percent = this.parseNumeric(sellerWorker.salaryPercent ?? 0);
            const commission = this.roundMoney((saleProfit * percent) / 100);
            sellerWorker.percentSalaryAccrued = this.toMoney(
              previousPercentSalary + commission,
            );
          }

          await workerRepository.save(sellerWorker);
        }

        if (dto.paymentType === SalePaymentType.PAID_NOW) {
          const activity = saleActivitiesRepository.create({
            sale: savedSale,
            paidAt: savedSale.soldAt,
            amount: this.toMoney(paidNow),
            notes: 'Full payment',
          });
          await saleActivitiesRepository.save(activity);
        } else {
          const months = installmentMonths ?? 1;
          const monthlyAmount = monthlyInstallmentAmount ?? 0;
          const note = firstPaymentNow
            ? `First month payment: ${this.toMoney(paidNow)}; Remaining: ${this.toMoney(
                remaining,
              )}; Installment: ${months} x ${this.toMoney(monthlyAmount)}`
            : `Installment plan: ${months} x ${this.toMoney(
                monthlyAmount,
              )}; Remaining: ${this.toMoney(remaining)}`;

          const activity = saleActivitiesRepository.create({
            sale: savedSale,
            paidAt: savedSale.soldAt,
            amount: this.toMoney(paidNow),
            notes: note,
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

  private async resolveSellerWorkerForSale(
    sellerWorkerId: number | undefined,
    manager: EntityManager,
  ): Promise<Worker | null> {
    if (!sellerWorkerId) {
      return null;
    }

    const worker = await manager.getRepository(Worker).findOne({
      where: { id: sellerWorkerId, isActive: true },
    });

    if (!worker) {
      throw new BadRequestException('sellerWorkerId is invalid');
    }

    return worker;
  }

  private roundMoney(value: number): number {
    return Math.round((value + Number.EPSILON) * 100) / 100;
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
