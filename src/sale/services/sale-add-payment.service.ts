import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Customer } from 'src/customer/entities/customer.entity';
import { InventoryItem } from 'src/inventory/entities/inventory-item.entity';
import { Repository } from 'typeorm';
import { AddSalePaymentDto } from '../dto/add-sale-payment.dto';
import { SaleDetailViewDto } from '../dto/sale-result.dto';
import { SaleActivity } from '../entities/sale-activity.entity';
import { SaleItem } from '../entities/sale-item.entity';
import { Sale, SalePaymentType } from '../entities/sale.entity';
import { toSaleDetailView } from '../helper';
import { SaleBaseService } from './sale-base.service';

@Injectable()
export class SaleAddPaymentService extends SaleBaseService {
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

  async execute(id: number, dto: AddSalePaymentDto): Promise<SaleDetailViewDto> {
    await this.salesRepository.manager.transaction(async (manager) => {
      const sale = await this.getActiveSaleOrThrow(id, manager);
      const currentPaidNow = this.parseNumeric(sale.paidNow);
      const currentRemaining = this.parseNumeric(sale.remaining);
      const amount = this.parseNumeric(dto.amount);

      if (amount <= 0) {
        throw new BadRequestException('Payment amount must be greater than 0');
      }

      if (currentRemaining <= 0) {
        throw new BadRequestException('Sale is already fully paid');
      }

      if (amount > currentRemaining) {
        throw new BadRequestException(
          `Payment amount cannot exceed remaining (${this.toMoney(currentRemaining)})`,
        );
      }

      const nextRemaining = currentRemaining - amount;

      sale.paidNow = this.toMoney(currentPaidNow + amount);
      sale.remaining = this.toMoney(nextRemaining);
      if (nextRemaining <= 0) {
        sale.paymentType = SalePaymentType.PAID_NOW;
      }
      await manager.getRepository(Sale).save(sale);

      const activity = manager.getRepository(SaleActivity).create({
        sale,
        paidAt: new Date(),
        amount: this.toMoney(amount),
        notes: dto.notes?.trim() || null,
      });
      await manager.getRepository(SaleActivity).save(activity);
    });

    const sale = await this.getActiveSaleWithItemsOrThrow(id);
    return toSaleDetailView(sale);
  }
}
