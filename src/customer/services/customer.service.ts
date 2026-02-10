import { Injectable } from '@nestjs/common';
import { CustomerQueryDto } from '../dto/customer-query.dto';
import { CustomerViewDto } from '../dto/customer-view.dto';
import {
  CustomerBalancesQueryDto,
  CustomerBalancesResponseDto,
} from '../dto/customer-balance.dto';
import { CustomerDetailDto } from '../dto/customer-detail.dto';
import { UpdateCustomerDto } from '../dto/update-customer.dto';
import {
  CustomerEnsureService,
  EnsureCustomerPayload,
} from './customer-ensure.service';
import { CustomerFindAllService } from './customer-find-all.service';
import { CustomerFindBalancesService } from './customer-find-balances.service';
import { CustomerFindDetailService } from './customer-find-detail.service';
import { CustomerFindOneService } from './customer-find-one.service';
import { CustomerUpdateService } from './customer-update.service';

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
export class CustomerService {
  constructor(
    private readonly findAllService: CustomerFindAllService,
    private readonly findBalancesService: CustomerFindBalancesService,
    private readonly findDetailService: CustomerFindDetailService,
    private readonly findOneService: CustomerFindOneService,
    private readonly updateService: CustomerUpdateService,
    private readonly ensureService: CustomerEnsureService,
  ) {}

  async findAll(query: CustomerQueryDto): Promise<CustomerListResponse> {
    return this.findAllService.execute(query);
  }

  async findOne(id: number): Promise<CustomerViewDto> {
    return this.findOneService.execute(id);
  }

  async findDetail(id: number): Promise<CustomerDetailDto> {
    return this.findDetailService.execute(id);
  }

  async findBalances(
    query: CustomerBalancesQueryDto,
  ): Promise<CustomerBalancesResponseDto> {
    return this.findBalancesService.execute(query);
  }

  async update(id: number, dto: UpdateCustomerDto): Promise<CustomerViewDto> {
    return this.updateService.execute(id, dto);
  }

  async ensure(payload: EnsureCustomerPayload) {
    return this.ensureService.ensureCustomer(payload);
  }
}
