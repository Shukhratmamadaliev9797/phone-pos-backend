import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { Customer } from 'src/customer/entities/customer.entity';
import { PurchaseActivity } from 'src/purchase/entities/purchase-activity.entity';
import { PurchaseItem } from 'src/purchase/entities/purchase-item.entity';
import {
  Purchase,
  PurchasePaymentMethod,
  PurchasePaymentType,
} from 'src/purchase/entities/purchase.entity';
import { Repair, RepairStatus } from 'src/repair/entities/repair.entity';
import { InventoryItemViewDto } from '../dto/inventory-item-view.dto';
import {
  AddPhonePaymentType,
  CreateInventoryItemDto,
} from '../dto/create-inventory-item.dto';
import { InventoryItem, InventoryItemStatus } from '../entities/inventory-item.entity';
import { toInventoryItemView } from '../helper';

@Injectable()
export class InventoryCreateService {
  constructor(
    @InjectRepository(InventoryItem)
    private readonly inventoryItemsRepository: Repository<InventoryItem>,
  ) {}

  async execute(dto: CreateInventoryItemDto): Promise<InventoryItemViewDto> {
    const imei = dto.imei?.trim() || this.buildAutoImei();

    if (
      dto.isPhonePurchased &&
      dto.paymentType === AddPhonePaymentType.PAY_LATER &&
      Number(dto.initialPayment ?? 0) > Number(dto.expectedSalePrice)
    ) {
      throw new BadRequestException(
        'Initial payment must not exceed phone price',
      );
    }

    const existingByImei = await this.inventoryItemsRepository.findOne({
      where: { imei },
      withDeleted: true,
    });
    if (existingByImei?.isActive) {
      throw new ConflictException('IMEI already exists');
    }

    try {
      const saved = await this.inventoryItemsRepository.manager.transaction(
        async (manager) => {
          const repository = manager.getRepository(InventoryItem);
          const customersRepository = manager.getRepository(Customer);
          const purchasesRepository = manager.getRepository(Purchase);
          const purchaseActivitiesRepository =
            manager.getRepository(PurchaseActivity);
          const purchaseItemsRepository = manager.getRepository(PurchaseItem);
          const repairsRepository = manager.getRepository(Repair);

          let customer: Customer | null = null;
          if (
            dto.isPhonePurchased &&
            dto.paymentType === AddPhonePaymentType.PAY_LATER &&
            dto.customer?.phoneNumber
          ) {
            const customerPhone = dto.customer.phoneNumber.trim();
            const existingCustomer = await customersRepository.findOne({
              where: { phoneNumber: customerPhone },
              withDeleted: true,
            });

            const customerPayload = {
              fullName:
                dto.customer.fullName?.trim() ||
                existingCustomer?.fullName ||
                'Unknown customer',
              phoneNumber: customerPhone,
              address: dto.customer.address?.trim() || existingCustomer?.address || null,
              passportId: existingCustomer?.passportId || null,
              notes: existingCustomer?.notes || null,
              isActive: true,
              deletedAt: null,
            } as const;

            customer = existingCustomer
              ? await customersRepository.save(
                  customersRepository.create({
                    ...existingCustomer,
                    ...customerPayload,
                  }),
                )
              : await customersRepository.save(
                  customersRepository.create(customerPayload),
                );
          }

          const preferredStatus = InventoryItemStatus.IN_STOCK;

          const basePayload = {
            imei,
            serialNumber: dto.serialNumber?.trim() || null,
            brand: dto.brand.trim(),
            model: dto.model.trim(),
            storage: dto.storage?.trim() || null,
            color: dto.color?.trim() || null,
            condition: dto.condition,
            status: preferredStatus,
            knownIssues: dto.knownIssues?.trim() || null,
            expectedSalePrice: Number(dto.expectedSalePrice).toFixed(2),
            purchase: null,
            sale: null,
            isActive: true,
            deletedAt: null,
          } as const;

          const persisted = existingByImei
            ? await repository.save(
                repository.create({
                  ...existingByImei,
                  ...basePayload,
                }),
              )
            : await repository.save(repository.create(basePayload));

          if (dto.isPhonePurchased) {
            const totalPrice = Number(dto.expectedSalePrice);
            const paymentType =
              dto.paymentType === AddPhonePaymentType.PAY_LATER
                ? PurchasePaymentType.PAY_LATER
                : PurchasePaymentType.PAID_NOW;
            const paidNow =
              paymentType === PurchasePaymentType.PAID_NOW
                ? totalPrice
                : Math.min(Number(dto.initialPayment ?? 0), totalPrice);
            const remaining = Math.max(totalPrice - paidNow, 0);

            const purchase = await purchasesRepository.save(
              purchasesRepository.create({
                purchasedAt: new Date(),
                customer,
                paymentMethod: dto.paymentMethod ?? PurchasePaymentMethod.CASH,
                paymentType,
                totalPrice: totalPrice.toFixed(2),
                paidNow: paidNow.toFixed(2),
                remaining: remaining.toFixed(2),
                notes: null,
                isActive: true,
                deletedAt: null,
              }),
            );

            await purchaseItemsRepository.save(
              purchaseItemsRepository.create({
                purchase,
                item: persisted,
                purchasePrice: totalPrice.toFixed(2),
                notes: null,
                isActive: true,
                deletedAt: null,
              }),
            );

            await repository.save(
              repository.create({
                ...persisted,
                purchase,
              }),
            );

            const initialPaymentActivity = purchaseActivitiesRepository.create({
              purchase,
              paidAt: purchase.purchasedAt,
              amount: paidNow.toFixed(2),
              notes:
                paymentType === PurchasePaymentType.PAID_NOW
                  ? `Full payment: ${paidNow.toFixed(2)}`
                  : `Initial payment: ${paidNow.toFixed(2)}, Remaining: ${remaining.toFixed(2)}`,
              isActive: true,
              deletedAt: null,
            });
            await purchaseActivitiesRepository.save(initialPaymentActivity);
          }

          if (dto.needsRepair || persisted.status === InventoryItemStatus.IN_REPAIR) {
            await repairsRepository.save(
              repairsRepository.create({
                item: persisted,
                repairedAt: new Date(),
                description:
                  dto.repairDescription?.trim() ||
                  dto.knownIssues?.trim() ||
                  'Repair case created from Add Phone flow',
                status: RepairStatus.PENDING,
                costTotal: Number(dto.repairCost ?? 0).toFixed(2),
                partsCost: null,
                laborCost: null,
                technician: null,
                notes:
                  dto.repairDescription?.trim() ||
                  dto.knownIssues?.trim() ||
                  null,
                }),
              );
          }

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

  private buildAutoImei(): string {
    const timestamp = Date.now().toString().slice(-10);
    const randomPart = Math.floor(Math.random() * 100000)
      .toString()
      .padStart(5, '0');
    return `${timestamp}${randomPart}`;
  }
}
