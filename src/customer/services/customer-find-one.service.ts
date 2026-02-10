import { Injectable } from '@nestjs/common';
import { CustomerViewDto } from '../dto/customer-view.dto';
import { toCustomerView } from '../helper';
import { CustomerBaseService } from './customer-base.service';

@Injectable()
export class CustomerFindOneService extends CustomerBaseService {
  async execute(id: number): Promise<CustomerViewDto> {
    const customer = await this.getActiveCustomerOrThrow(id);
    return toCustomerView(customer);
  }
}
