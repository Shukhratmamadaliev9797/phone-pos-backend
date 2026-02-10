import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomerModule } from 'src/customer/customer.module';
import { Customer } from 'src/customer/entities/customer.entity';
import { InventoryItem } from 'src/inventory/entities/inventory-item.entity';
import { RepairEntry } from 'src/repair/entities/repair-entry.entity';
import { Repair } from 'src/repair/entities/repair.entity';
import { SaleActivity } from 'src/sale/entities/sale-activity.entity';
import { SaleItem } from 'src/sale/entities/sale-item.entity';
import { Sale } from 'src/sale/entities/sale.entity';
import { PurchaseController } from './purchase.controller';
import { PurchaseActivity } from './entities/purchase-activity.entity';
import { PurchaseItem } from './entities/purchase-item.entity';
import { Purchase } from './entities/purchase.entity';
import { PurchaseAddPaymentService } from './services/purchase-add-payment.service';
import { PurchaseBaseService } from './services/purchase-base.service';
import { PurchaseCreateService } from './services/purchase-create.service';
import { PurchaseDeleteService } from './services/purchase-delete.service';
import { PurchaseFindAllService } from './services/purchase-find-all.service';
import { PurchaseFindOneService } from './services/purchase-find-one.service';
import { PurchaseService } from './services/purchase.service';
import { PurchaseUpdateService } from './services/purchase-update.service';

@Module({
  imports: [
    CustomerModule,
    TypeOrmModule.forFeature([
      Purchase,
      PurchaseItem,
      PurchaseActivity,
      InventoryItem,
      Customer,
      Repair,
      RepairEntry,
      Sale,
      SaleItem,
      SaleActivity,
    ]),
  ],
  controllers: [PurchaseController],
  providers: [
    PurchaseBaseService,
    PurchaseCreateService,
    PurchaseAddPaymentService,
    PurchaseUpdateService,
    PurchaseFindAllService,
    PurchaseFindOneService,
    PurchaseDeleteService,
    PurchaseService,
  ],
  exports: [PurchaseService],
})
export class PurchaseModule {}
