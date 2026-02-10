import { Injectable } from '@nestjs/common';
import { CustomerQueryDto } from '../dto/customer-query.dto';
import { CustomerViewDto } from '../dto/customer-view.dto';
import { toCustomerView } from '../helper';
import { CustomerBaseService } from './customer-base.service';

type CustomerListResponse = {
  data: CustomerViewDto[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};

@Injectable()
export class CustomerFindAllService extends CustomerBaseService {
  async execute(query: CustomerQueryDto): Promise<CustomerListResponse> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    const builder = this.customersRepository
      .createQueryBuilder('customer')
      .where('customer.isActive = :isActive', { isActive: true })
      .orderBy('customer.id', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const search = query.search?.trim();
    if (search) {
      builder.andWhere(
        '(customer.phoneNumber ILIKE :search OR customer.fullName ILIKE :search)',
        {
          search: `%${search}%`,
        },
      );
    }

    const [data, total] = await builder.getManyAndCount();

    return {
      data: data.map(toCustomerView),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }
}
