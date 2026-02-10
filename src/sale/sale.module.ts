import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomerModule } from 'src/customer/customer.module';
import { Customer } from 'src/customer/entities/customer.entity';
import { InventoryItem } from 'src/inventory/entities/inventory-item.entity';
import { RepairEntry } from 'src/repair/entities/repair-entry.entity';
import { Repair } from 'src/repair/entities/repair.entity';
import { SaleController } from './sale.controller';
import { SaleActivity } from './entities/sale-activity.entity';
import { Sale } from './entities/sale.entity';
import { SaleItem } from './entities/sale-item.entity';
import { SaleAddPaymentService } from './services/sale-add-payment.service';
import { SaleBaseService } from './services/sale-base.service';
import { SaleAvailableItemsService } from './services/sale-available-items.service';
import { SaleCreateService } from './services/sale-create.service';
import { SaleDeleteService } from './services/sale-delete.service';
import { SaleFindAllService } from './services/sale-find-all.service';
import { SaleFindOneService } from './services/sale-find-one.service';
import { SaleService } from './services/sale.service';
import { SaleUpdateService } from './services/sale-update.service';

@Module({
  imports: [
    CustomerModule,
    TypeOrmModule.forFeature([
      Sale,
      SaleItem,
      SaleActivity,
      InventoryItem,
      Customer,
      Repair,
      RepairEntry,
    ]),
  ],
  controllers: [SaleController],
  providers: [
    SaleBaseService,
    SaleAvailableItemsService,
    SaleCreateService,
    SaleUpdateService,
    SaleFindAllService,
    SaleFindOneService,
    SaleAddPaymentService,
    SaleDeleteService,
    SaleService,
  ],
  exports: [SaleService],
})
export class SaleModule {}
