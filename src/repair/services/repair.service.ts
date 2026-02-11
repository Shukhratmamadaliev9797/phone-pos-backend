import { Injectable } from '@nestjs/common';
import { AddRepairEntryDto } from '../dto/add-repair-entry.dto';
import { CreateRepairCaseDto } from '../dto/create-repair-case.dto';
import {
  RepairAvailableItemDto,
  RepairAvailableItemsQueryDto,
  RepairDetailViewDto,
  RepairListQueryDto,
  RepairListResponseDto,
} from '../dto/repair-result.dto';
import { UpdateRepairCaseDto } from '../dto/update-repair-case.dto';
import { UpdateRepairEntryDto } from '../dto/update-repair-entry.dto';
import { RepairAddEntryService } from './repair-add-entry.service';
import { RepairAvailableItemsService } from './repair-available-items.service';
import { RepairCreateCaseService } from './repair-create-case.service';
import { RepairDeleteEntryService } from './repair-delete-entry.service';
import { RepairFindAllService } from './repair-find-all.service';
import { RepairFindOneService } from './repair-find-one.service';
import { RepairUpdateCaseService } from './repair-update-case.service';
import { RepairUpdateEntryService } from './repair-update-entry.service';

@Injectable()
export class RepairService {
  constructor(
    private readonly findAllService: RepairFindAllService,
    private readonly findOneService: RepairFindOneService,
    private readonly availableItemsService: RepairAvailableItemsService,
    private readonly createCaseService: RepairCreateCaseService,
    private readonly updateCaseService: RepairUpdateCaseService,
    private readonly addEntryService: RepairAddEntryService,
    private readonly updateEntryService: RepairUpdateEntryService,
    private readonly deleteEntryService: RepairDeleteEntryService,
  ) {}

  async findAll(query: RepairListQueryDto): Promise<RepairListResponseDto> {
    return this.findAllService.execute(query);
  }

  async findOne(id: number): Promise<RepairDetailViewDto> {
    return this.findOneService.execute(id);
  }

  async availableItems(
    query: RepairAvailableItemsQueryDto,
  ): Promise<RepairAvailableItemDto[]> {
    return this.availableItemsService.execute(query);
  }

  async createCase(dto: CreateRepairCaseDto): Promise<RepairDetailViewDto> {
    return this.createCaseService.execute(dto);
  }

  async updateCase(
    id: number,
    dto: UpdateRepairCaseDto,
  ): Promise<RepairDetailViewDto> {
    return this.updateCaseService.execute(id, dto);
  }

  async addEntry(id: number, dto: AddRepairEntryDto): Promise<RepairDetailViewDto> {
    return this.addEntryService.execute(id, dto);
  }

  async updateEntry(
    entryId: number,
    dto: UpdateRepairEntryDto,
  ): Promise<RepairDetailViewDto> {
    return this.updateEntryService.execute(entryId, dto);
  }

  async deleteEntry(entryId: number): Promise<RepairDetailViewDto> {
    return this.deleteEntryService.execute(entryId);
  }
}
