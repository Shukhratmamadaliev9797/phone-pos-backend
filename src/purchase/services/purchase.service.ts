import { Injectable } from '@nestjs/common';
import { AddPurchasePaymentDto } from '../dto/add-purchase-payment.dto';
import { CreatePurchaseDto } from '../dto/create-purchase.dto';
import {
  PurchaseDetailViewDto,
  PurchaseListQueryDto,
  PurchaseListResponseDto,
} from '../dto/purchase-result.dto';
import { UpdatePurchaseDto } from '../dto/update-purchase.dto';
import { PurchaseCreateService } from './purchase-create.service';
import { PurchaseAddPaymentService } from './purchase-add-payment.service';
import { PurchaseFindAllService } from './purchase-find-all.service';
import { PurchaseFindOneService } from './purchase-find-one.service';
import { PurchaseUpdateService } from './purchase-update.service';
import { PurchaseDeleteService } from './purchase-delete.service';

@Injectable()
export class PurchaseService {
  constructor(
    private readonly createService: PurchaseCreateService,
    private readonly updateService: PurchaseUpdateService,
    private readonly findAllService: PurchaseFindAllService,
    private readonly findOneService: PurchaseFindOneService,
    private readonly addPaymentService: PurchaseAddPaymentService,
    private readonly deleteService: PurchaseDeleteService,
  ) {}

  async create(dto: CreatePurchaseDto): Promise<PurchaseDetailViewDto> {
    return this.createService.execute(dto);
  }

  async update(id: number, dto: UpdatePurchaseDto): Promise<PurchaseDetailViewDto> {
    return this.updateService.execute(id, dto);
  }

  async findAll(query: PurchaseListQueryDto): Promise<PurchaseListResponseDto> {
    return this.findAllService.execute(query);
  }

  async findOne(id: number): Promise<PurchaseDetailViewDto> {
    return this.findOneService.execute(id);
  }

  async addPayment(
    id: number,
    dto: AddPurchasePaymentDto,
  ): Promise<PurchaseDetailViewDto> {
    return this.addPaymentService.execute(id, dto);
  }

  async delete(id: number): Promise<{ success: true }> {
    return this.deleteService.execute(id);
  }
}
