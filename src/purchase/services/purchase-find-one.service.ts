import { Injectable } from '@nestjs/common';
import { PurchaseDetailViewDto } from '../dto/purchase-result.dto';
import { toPurchaseDetailView } from '../helper';
import { PurchaseBaseService } from './purchase-base.service';

@Injectable()
export class PurchaseFindOneService extends PurchaseBaseService {
  async execute(id: number): Promise<PurchaseDetailViewDto> {
    const purchase = await this.getActivePurchaseWithItemsOrThrow(id);
    return toPurchaseDetailView(purchase);
  }
}
