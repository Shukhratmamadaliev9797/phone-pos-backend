import { CustomerViewDto } from './dto/customer-view.dto';
import { Customer } from './entities/customer.entity';

export function toCustomerView(customer: Customer): CustomerViewDto {
  return {
    id: customer.id,
    fullName: customer.fullName,
    phoneNumber: customer.phoneNumber,
    address: customer.address,
    passportId: customer.passportId,
    notes: customer.notes,
  };
}
