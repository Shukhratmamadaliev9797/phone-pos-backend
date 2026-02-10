import {
  Delete,
  Post,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Query,
  Body,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRole } from 'src/user/user/entities/user.entity';
import {
  InventoryItemsQueryDto,
  InventoryListResponseDto,
} from './dto/inventory-items-query.dto';
import { InventoryItemViewDto } from './dto/inventory-item-view.dto';
import { UpdateInventoryItemDto } from './dto/update-inventory-item.dto';
import { CreateInventoryItemDto } from './dto/create-inventory-item.dto';
import { InventoryFindAllService } from './services/inventory-find-all.service';
import { InventoryUpdateService } from './services/inventory-update.service';
import { InventoryCreateService } from './services/inventory-create.service';
import { InventoryDeleteService } from './services/inventory-delete.service';

@ApiTags('Inventory')
@ApiBearerAuth('access-token')
@Controller('api/inventory-items')
export class InventoryController {
  constructor(
    private readonly inventoryFindAllService: InventoryFindAllService,
    private readonly inventoryUpdateService: InventoryUpdateService,
    private readonly inventoryCreateService: InventoryCreateService,
    private readonly inventoryDeleteService: InventoryDeleteService,
  ) {}

  @Post()
  @Roles(UserRole.OWNER_ADMIN, UserRole.MANAGER, UserRole.CASHIER)
  @ApiOkResponse({ type: InventoryItemViewDto })
  async create(
    @Body() dto: CreateInventoryItemDto,
  ): Promise<InventoryItemViewDto> {
    return this.inventoryCreateService.execute(dto);
  }

  @Get()
  @Roles(
    UserRole.OWNER_ADMIN,
    UserRole.MANAGER,
    UserRole.CASHIER,
    UserRole.TECHNICIAN,
  )
  @ApiOkResponse({ type: InventoryListResponseDto })
  async findAll(
    @Query() query: InventoryItemsQueryDto,
  ): Promise<InventoryListResponseDto> {
    return this.inventoryFindAllService.execute(query);
  }

  @Patch(':id')
  @Roles(UserRole.OWNER_ADMIN, UserRole.MANAGER, UserRole.CASHIER)
  @ApiOkResponse({ type: InventoryItemViewDto })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateInventoryItemDto,
  ): Promise<InventoryItemViewDto> {
    return this.inventoryUpdateService.execute(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.OWNER_ADMIN, UserRole.MANAGER, UserRole.CASHIER)
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
    return this.inventoryDeleteService.execute(id);
  }
}
