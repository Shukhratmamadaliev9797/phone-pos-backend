import { Injectable } from '@nestjs/common';
import { CreateSaleDto } from '../dto/create-sale.dto';
import { AddSalePaymentDto } from '../dto/add-sale-payment.dto';
import {
  SaleAvailableItemDto,
  SaleAvailableItemsQueryDto,
  SaleDetailViewDto,
  SaleListQueryDto,
  SaleListResponseDto,
} from '../dto/sale-result.dto';
import { UpdateSaleDto } from '../dto/update-sale.dto';
import { SaleAvailableItemsService } from './sale-available-items.service';
import { SaleAddPaymentService } from './sale-add-payment.service';
import { SaleCreateService } from './sale-create.service';
import { SaleFindAllService } from './sale-find-all.service';
import { SaleFindOneService } from './sale-find-one.service';
import { SaleUpdateService } from './sale-update.service';
import { SaleDeleteService } from './sale-delete.service';

@Injectable()
export class SaleService {
  constructor(
    private readonly createService: SaleCreateService,
    private readonly updateService: SaleUpdateService,
    private readonly findAllService: SaleFindAllService,
    private readonly findOneService: SaleFindOneService,
    private readonly availableItemsService: SaleAvailableItemsService,
    private readonly addPaymentService: SaleAddPaymentService,
    private readonly deleteService: SaleDeleteService,
  ) {}

  async create(dto: CreateSaleDto): Promise<SaleDetailViewDto> {
    return this.createService.execute(dto);
  }

  async update(id: number, dto: UpdateSaleDto): Promise<SaleDetailViewDto> {
    return this.updateService.execute(id, dto);
  }

  async findAll(query: SaleListQueryDto): Promise<SaleListResponseDto> {
    return this.findAllService.execute(query);
  }

  async findOne(id: number): Promise<SaleDetailViewDto> {
    return this.findOneService.execute(id);
  }

  async availableItems(
    query: SaleAvailableItemsQueryDto,
  ): Promise<SaleAvailableItemDto[]> {
    return this.availableItemsService.execute(query);
  }

  async addPayment(id: number, dto: AddSalePaymentDto): Promise<SaleDetailViewDto> {
    return this.addPaymentService.execute(id, dto);
  }

  async delete(id: number): Promise<{ success: true }> {
    return this.deleteService.execute(id);
  }
}
