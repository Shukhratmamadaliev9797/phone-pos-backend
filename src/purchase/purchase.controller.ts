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
import { AddPurchasePaymentDto } from './dto/add-purchase-payment.dto';
import { CreatePurchaseDto } from './dto/create-purchase.dto';
import {
  PurchaseDetailViewDto,
  PurchaseListQueryDto,
  PurchaseListResponseDto,
} from './dto/purchase-result.dto';
import { UpdatePurchaseDto } from './dto/update-purchase.dto';
import { PurchaseService } from './services/purchase.service';

@ApiTags('Purchases')
@ApiBearerAuth('access-token')
@Roles(
  UserRole.OWNER_ADMIN,
  UserRole.MANAGER,
  UserRole.CASHIER,
  UserRole.TECHNICIAN,
)
@Controller('api/purchases')
export class PurchaseController {
  constructor(private readonly purchases: PurchaseService) {}

  @Post()
  @Roles(UserRole.OWNER_ADMIN, UserRole.MANAGER, UserRole.CASHIER)
  @ApiCreatedResponse({ type: PurchaseDetailViewDto })
  async create(@Body() dto: CreatePurchaseDto): Promise<PurchaseDetailViewDto> {
    return this.purchases.create(dto);
  }

  @Patch(':id')
  @Roles(UserRole.OWNER_ADMIN, UserRole.MANAGER, UserRole.CASHIER)
  @ApiOkResponse({ type: PurchaseDetailViewDto })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePurchaseDto,
  ): Promise<PurchaseDetailViewDto> {
    return this.purchases.update(id, dto);
  }

  @Post(':id/payments')
  @Roles(UserRole.OWNER_ADMIN, UserRole.MANAGER, UserRole.CASHIER)
  @ApiOkResponse({ type: PurchaseDetailViewDto })
  async addPayment(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AddPurchasePaymentDto,
  ): Promise<PurchaseDetailViewDto> {
    return this.purchases.addPayment(id, dto);
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
    return this.purchases.delete(id);
  }

  @Get()
  @ApiOkResponse({ type: PurchaseListResponseDto })
  async findAll(
    @Query() query: PurchaseListQueryDto,
  ): Promise<PurchaseListResponseDto> {
    return this.purchases.findAll(query);
  }

  @Get(':id')
  @ApiOkResponse({ type: PurchaseDetailViewDto })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<PurchaseDetailViewDto> {
    return this.purchases.findOne(id);
  }
}
