import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRole } from 'src/user/user/entities/user.entity';
import { AddSalePaymentDto } from './dto/add-sale-payment.dto';
import { CreateSaleDto } from './dto/create-sale.dto';
import {
  SaleAvailableItemDto,
  SaleAvailableItemsQueryDto,
  SaleDetailViewDto,
  SaleListQueryDto,
  SaleListResponseDto,
} from './dto/sale-result.dto';
import { UpdateSaleDto } from './dto/update-sale.dto';
import { SaleService } from './services/sale.service';

@ApiTags('Sales')
@ApiBearerAuth('access-token')
@Controller('api/sales')
export class SaleController {
  constructor(private readonly sales: SaleService) {}

  @Get('available-items')
  @Roles(
    UserRole.OWNER_ADMIN,
    UserRole.MANAGER,
    UserRole.CASHIER,
    UserRole.TECHNICIAN,
  )
  @ApiOkResponse({ type: [SaleAvailableItemDto] })
  async availableItems(
    @Query() query: SaleAvailableItemsQueryDto,
  ): Promise<SaleAvailableItemDto[]> {
    return this.sales.availableItems(query);
  }

  @Post()
  @Roles(UserRole.OWNER_ADMIN, UserRole.MANAGER, UserRole.CASHIER)
  @ApiCreatedResponse({ type: SaleDetailViewDto })
  async create(@Body() dto: CreateSaleDto): Promise<SaleDetailViewDto> {
    return this.sales.create(dto);
  }

  @Patch(':id')
  @Roles(UserRole.OWNER_ADMIN, UserRole.MANAGER, UserRole.CASHIER)
  @ApiOkResponse({ type: SaleDetailViewDto })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSaleDto,
  ): Promise<SaleDetailViewDto> {
    return this.sales.update(id, dto);
  }

  @Post(':id/payments')
  @Roles(UserRole.OWNER_ADMIN, UserRole.MANAGER, UserRole.CASHIER)
  @ApiOkResponse({ type: SaleDetailViewDto })
  async addPayment(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AddSalePaymentDto,
  ): Promise<SaleDetailViewDto> {
    return this.sales.addPayment(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.OWNER_ADMIN)
  @ApiOkResponse({
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
      },
    },
  })
  async delete(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<{ success: true }> {
    return this.sales.delete(id);
  }

  @Get()
  @Roles(
    UserRole.OWNER_ADMIN,
    UserRole.MANAGER,
    UserRole.CASHIER,
    UserRole.TECHNICIAN,
  )
  @ApiOkResponse({ type: SaleListResponseDto })
  async findAll(@Query() query: SaleListQueryDto): Promise<SaleListResponseDto> {
    return this.sales.findAll(query);
  }

  @Get(':id')
  @Roles(
    UserRole.OWNER_ADMIN,
    UserRole.MANAGER,
    UserRole.CASHIER,
    UserRole.TECHNICIAN,
  )
  @ApiOkResponse({ type: SaleDetailViewDto })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<SaleDetailViewDto> {
    return this.sales.findOne(id);
  }
}
