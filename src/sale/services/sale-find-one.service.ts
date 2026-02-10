import { Injectable } from '@nestjs/common';
import { SaleDetailViewDto } from '../dto/sale-result.dto';
import { toSaleDetailView } from '../helper';
import { SaleBaseService } from './sale-base.service';

@Injectable()
export class SaleFindOneService extends SaleBaseService {
  async execute(id: number): Promise<SaleDetailViewDto> {
    const sale = await this.getActiveSaleWithItemsOrThrow(id);
    return toSaleDetailView(sale);
  }
}
