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
import { AddRepairEntryDto } from './dto/add-repair-entry.dto';
import { CreateRepairCaseDto } from './dto/create-repair-case.dto';
import {
  RepairAvailableItemDto,
  RepairAvailableItemsQueryDto,
  RepairDetailViewDto,
  RepairListQueryDto,
  RepairListResponseDto,
} from './dto/repair-result.dto';
import { UpdateRepairCaseDto } from './dto/update-repair-case.dto';
import { UpdateRepairEntryDto } from './dto/update-repair-entry.dto';
import { RepairService } from './services/repair.service';

@ApiTags('Repairs')
@ApiBearerAuth('access-token')
@Controller('api/repairs')
export class RepairController {
  constructor(private readonly repairs: RepairService) {}

  @Get('available-items')
  @Roles(
    UserRole.OWNER_ADMIN,
    UserRole.MANAGER,
    UserRole.CASHIER,
    UserRole.TECHNICIAN,
  )
  @ApiOkResponse({ type: [RepairAvailableItemDto] })
  async availableItems(
    @Query() query: RepairAvailableItemsQueryDto,
  ): Promise<RepairAvailableItemDto[]> {
    return this.repairs.availableItems(query);
  }

  @Post('cases')
  @Roles(UserRole.OWNER_ADMIN, UserRole.MANAGER, UserRole.TECHNICIAN)
  @ApiCreatedResponse({ type: RepairDetailViewDto })
  async createCase(@Body() dto: CreateRepairCaseDto): Promise<RepairDetailViewDto> {
    return this.repairs.createCase(dto);
  }

  @Patch('cases/:id')
  @Roles(UserRole.OWNER_ADMIN, UserRole.MANAGER, UserRole.TECHNICIAN)
  @ApiOkResponse({ type: RepairDetailViewDto })
  async updateCase(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateRepairCaseDto,
  ): Promise<RepairDetailViewDto> {
    return this.repairs.updateCase(id, dto);
  }

  @Post('cases/:id/entries')
  @Roles(UserRole.OWNER_ADMIN, UserRole.MANAGER, UserRole.TECHNICIAN)
  @ApiOkResponse({ type: RepairDetailViewDto })
  async addEntry(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AddRepairEntryDto,
  ): Promise<RepairDetailViewDto> {
    return this.repairs.addEntry(id, dto);
  }

  @Patch('entries/:entryId')
  @Roles(UserRole.OWNER_ADMIN, UserRole.MANAGER, UserRole.TECHNICIAN)
  @ApiOkResponse({ type: RepairDetailViewDto })
  async updateEntry(
    @Param('entryId', ParseIntPipe) entryId: number,
    @Body() dto: UpdateRepairEntryDto,
  ): Promise<RepairDetailViewDto> {
    return this.repairs.updateEntry(entryId, dto);
  }

  @Delete('entries/:entryId')
  @Roles(UserRole.OWNER_ADMIN, UserRole.MANAGER, UserRole.TECHNICIAN)
  @ApiOkResponse({ type: RepairDetailViewDto })
  async deleteEntry(
    @Param('entryId', ParseIntPipe) entryId: number,
  ): Promise<RepairDetailViewDto> {
    return this.repairs.deleteEntry(entryId);
  }

  @Get()
  @Roles(
    UserRole.OWNER_ADMIN,
    UserRole.MANAGER,
    UserRole.CASHIER,
    UserRole.TECHNICIAN,
  )
  @ApiOkResponse({ type: RepairListResponseDto })
  async findAll(@Query() query: RepairListQueryDto): Promise<RepairListResponseDto> {
    return this.repairs.findAll(query);
  }

  @Get(':id')
  @Roles(
    UserRole.OWNER_ADMIN,
    UserRole.MANAGER,
    UserRole.CASHIER,
    UserRole.TECHNICIAN,
  )
  @ApiOkResponse({ type: RepairDetailViewDto })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<RepairDetailViewDto> {
    return this.repairs.findOne(id);
  }
}
