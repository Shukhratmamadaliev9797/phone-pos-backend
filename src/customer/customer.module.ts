import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InventoryItem } from 'src/inventory/entities/inventory-item.entity';
import { PurchaseActivity } from 'src/purchase/entities/purchase-activity.entity';
import { Purchase } from 'src/purchase/entities/purchase.entity';
import { SaleActivity } from 'src/sale/entities/sale-activity.entity';
import { Sale } from 'src/sale/entities/sale.entity';
import { CustomerController } from './customer.controller';
import { Customer } from './entities/customer.entity';
import { CustomerBaseService } from './services/customer-base.service';
import { CustomerEnsureService } from './services/customer-ensure.service';
import { CustomerFindAllService } from './services/customer-find-all.service';
import { CustomerFindBalancesService } from './services/customer-find-balances.service';
import { CustomerFindDetailService } from './services/customer-find-detail.service';
import { CustomerFindOneService } from './services/customer-find-one.service';
import { CustomerService } from './services/customer.service';
import { CustomerUpdateService } from './services/customer-update.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Customer,
      Sale,
      Purchase,
      SaleActivity,
      PurchaseActivity,
      InventoryItem,
    ]),
  ],
  controllers: [CustomerController],
  providers: [
    CustomerBaseService,
    CustomerEnsureService,
    CustomerFindAllService,
    CustomerFindBalancesService,
    CustomerFindDetailService,
    CustomerFindOneService,
    CustomerUpdateService,
    CustomerService,
  ],
  exports: [CustomerEnsureService, CustomerService],
})
export class CustomerModule {}
