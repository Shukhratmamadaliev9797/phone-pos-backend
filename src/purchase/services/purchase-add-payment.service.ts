import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Customer } from 'src/customer/entities/customer.entity';
import { InventoryItem } from 'src/inventory/entities/inventory-item.entity';
import { Repository } from 'typeorm';
import { AddPurchasePaymentDto } from '../dto/add-purchase-payment.dto';
import { PurchaseDetailViewDto } from '../dto/purchase-result.dto';
import { PurchaseActivity } from '../entities/purchase-activity.entity';
import { PurchaseItem } from '../entities/purchase-item.entity';
import { Purchase, PurchasePaymentType } from '../entities/purchase.entity';
import { toPurchaseDetailView } from '../helper';
import { PurchaseBaseService } from './purchase-base.service';

@Injectable()
export class PurchaseAddPaymentService extends PurchaseBaseService {
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

  async execute(
    id: number,
    dto: AddPurchasePaymentDto,
  ): Promise<PurchaseDetailViewDto> {
    await this.purchasesRepository.manager.transaction(async (manager) => {
      const purchase = await this.getActivePurchaseOrThrow(id, manager);
      const currentPaidNow = this.parseNumeric(purchase.paidNow);
      const currentRemaining = this.parseNumeric(purchase.remaining);
      const amount = this.parseNumeric(dto.amount);

      if (amount <= 0) {
        throw new BadRequestException('Payment amount must be greater than 0');
      }

      if (currentRemaining <= 0) {
        throw new BadRequestException('Purchase is already fully paid');
      }

      if (amount > currentRemaining) {
        throw new BadRequestException(
          `Payment amount cannot exceed remaining (${this.toMoney(currentRemaining)})`,
        );
      }

      const nextRemaining = currentRemaining - amount;

      purchase.paidNow = this.toMoney(currentPaidNow + amount);
      purchase.remaining = this.toMoney(nextRemaining);
      if (nextRemaining <= 0) {
        purchase.paymentType = PurchasePaymentType.PAID_NOW;
      }
      await manager.getRepository(Purchase).save(purchase);

      const notes =
        nextRemaining <= 0
          ? "To'liq to'landi"
          : dto.notes?.trim() || null;

      const activity = manager.getRepository(PurchaseActivity).create({
        purchase,
        paidAt: new Date(),
        amount: this.toMoney(amount),
        notes,
      });
      await manager.getRepository(PurchaseActivity).save(activity);
    });

    const purchase = await this.getActivePurchaseWithItemsOrThrow(id);
    return toPurchaseDetailView(purchase);
  }
}
