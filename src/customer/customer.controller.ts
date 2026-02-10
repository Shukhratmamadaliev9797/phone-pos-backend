import { Body, Controller, Get, Param, ParseIntPipe, Patch, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRole } from 'src/user/user/entities/user.entity';
import {
  CustomerBalancesQueryDto,
  CustomerBalancesResponseDto,
} from './dto/customer-balance.dto';
import { CustomerDetailDto } from './dto/customer-detail.dto';
import { CustomerQueryDto } from './dto/customer-query.dto';
import { CustomerViewDto } from './dto/customer-view.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { CustomerService } from './services/customer.service';

type CustomerListResponse = {
  data: CustomerViewDto[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};

@ApiTags('Customers')
@ApiBearerAuth('access-token')
@Controller('api/customers')
export class CustomerController {
  constructor(private readonly customers: CustomerService) {}

  @Get('balances')
  @Roles(UserRole.OWNER_ADMIN, UserRole.MANAGER, UserRole.CASHIER)
  @ApiOkResponse({ type: CustomerBalancesResponseDto })
  async findBalances(
    @Query() query: CustomerBalancesQueryDto,
  ): Promise<CustomerBalancesResponseDto> {
    return this.customers.findBalances(query);
  }

  @Get()
  @Roles(UserRole.OWNER_ADMIN, UserRole.MANAGER, UserRole.CASHIER)
  @ApiOkResponse({ type: [CustomerViewDto] })
  async findAll(@Query() query: CustomerQueryDto): Promise<CustomerListResponse> {
    return this.customers.findAll(query);
  }

  @Patch(':id')
  @Roles(UserRole.OWNER_ADMIN, UserRole.MANAGER)
  @ApiOkResponse({ type: CustomerViewDto })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCustomerDto,
  ): Promise<CustomerViewDto> {
    return this.customers.update(id, dto);
  }

  @Get(':id/details')
  @Roles(UserRole.OWNER_ADMIN, UserRole.MANAGER, UserRole.CASHIER)
  @ApiOkResponse({ type: CustomerDetailDto })
  async findDetail(@Param('id', ParseIntPipe) id: number): Promise<CustomerDetailDto> {
    return this.customers.findDetail(id);
  }

  @Get(':id')
  @Roles(UserRole.OWNER_ADMIN, UserRole.MANAGER, UserRole.CASHIER)
  @ApiOkResponse({ type: CustomerViewDto })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<CustomerViewDto> {
    return this.customers.findOne(id);
  }
}
