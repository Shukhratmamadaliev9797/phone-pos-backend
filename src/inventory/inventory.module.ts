import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InventoryActivity } from './entities/inventory-activity.entity';
import { InventoryItem } from './entities/inventory-item.entity';
import { InventoryController } from './inventory.controller';
import { InventoryFindAllService } from './services/inventory-find-all.service';
import { InventoryFindOneService } from './services/inventory-find-one.service';
import { InventoryUpdateService } from './services/inventory-update.service';
import { InventoryCreateService } from './services/inventory-create.service';
import { InventoryDeleteService } from './services/inventory-delete.service';

@Module({
  imports: [TypeOrmModule.forFeature([InventoryItem, InventoryActivity])],
  controllers: [InventoryController],
  providers: [
    InventoryFindAllService,
    InventoryFindOneService,
    InventoryUpdateService,
    InventoryCreateService,
    InventoryDeleteService,
  ],
})
export class InventoryModule {}
