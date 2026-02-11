import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InventoryItem } from 'src/inventory/entities/inventory-item.entity';
import { User } from 'src/user/user/entities/user.entity';
import { RepairController } from './repair.controller';
import { RepairEntry } from './entities/repair-entry.entity';
import { Repair } from './entities/repair.entity';
import { RepairAddEntryService } from './services/repair-add-entry.service';
import { RepairAvailableItemsService } from './services/repair-available-items.service';
import { RepairBaseService } from './services/repair-base.service';
import { RepairCreateCaseService } from './services/repair-create-case.service';
import { RepairDeleteEntryService } from './services/repair-delete-entry.service';
import { RepairFindAllService } from './services/repair-find-all.service';
import { RepairFindOneService } from './services/repair-find-one.service';
import { RepairService } from './services/repair.service';
import { RepairUpdateCaseService } from './services/repair-update-case.service';
import { RepairUpdateEntryService } from './services/repair-update-entry.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Repair, RepairEntry, InventoryItem, User]),
  ],
  controllers: [RepairController],
  providers: [
    RepairBaseService,
    RepairFindAllService,
    RepairFindOneService,
    RepairAvailableItemsService,
    RepairCreateCaseService,
    RepairUpdateCaseService,
    RepairAddEntryService,
    RepairUpdateEntryService,
    RepairDeleteEntryService,
    RepairService,
  ],
  exports: [RepairService],
})
export class RepairModule {}
