import { Injectable } from '@nestjs/common';
import { UpdateCustomerDto } from '../dto/update-customer.dto';
import { CustomerViewDto } from '../dto/customer-view.dto';
import { toCustomerView } from '../helper';
import { CustomerBaseService } from './customer-base.service';

@Injectable()
export class CustomerUpdateService extends CustomerBaseService {
  async execute(id: number, dto: UpdateCustomerDto): Promise<CustomerViewDto> {
    const customer = await this.getActiveCustomerOrThrow(id);

    if (dto.fullName !== undefined) {
      customer.fullName = dto.fullName.trim() || customer.fullName;
    }
    if (dto.address !== undefined) {
      customer.address = dto.address.trim() || null;
    }
    if (dto.passportId !== undefined) {
      customer.passportId = dto.passportId.trim() || null;
    }
    if (dto.notes !== undefined) {
      customer.notes = dto.notes.trim() || null;
    }

    await this.customersRepository.save(customer);
    return toCustomerView(customer);
  }
}
