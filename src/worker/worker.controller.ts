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
import { CreateSalaryPaymentDto } from './dto/create-salary-payment.dto';
import { CreateWorkerDto } from './dto/create-worker.dto';
import { WorkerQueryDto, WorkerSalaryPaymentQueryDto } from './dto/worker-query.dto';
import {
  SalaryPaymentViewDto,
  WorkerDetailsViewDto,
  WorkerListResponseDto,
  WorkerSalaryPaymentListResponseDto,
  WorkerViewDto,
} from './dto/worker-result.dto';
import { UpdateWorkerDto } from './dto/update-worker.dto';
import { WorkerService } from './services/worker.service';

@ApiTags('Workers')
@ApiBearerAuth('access-token')
@Roles(UserRole.OWNER_ADMIN)
@Controller('api/workers')
export class WorkerController {
  constructor(private readonly workers: WorkerService) {}

  @Get()
  @ApiOkResponse({ type: WorkerListResponseDto })
  async findAll(@Query() query: WorkerQueryDto): Promise<WorkerListResponseDto> {
    return this.workers.findAll(query);
  }

  @Post()
  @ApiCreatedResponse({ type: WorkerViewDto })
  async create(@Body() dto: CreateWorkerDto): Promise<WorkerViewDto> {
    return this.workers.create(dto);
  }

  @Post(':id/salary-payments')
  @ApiCreatedResponse({ type: SalaryPaymentViewDto })
  async paySalary(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateSalaryPaymentDto,
  ): Promise<SalaryPaymentViewDto> {
    return this.workers.paySalary(id, dto);
  }

  @Get(':id/salary-payments')
  @ApiOkResponse({ type: WorkerSalaryPaymentListResponseDto })
  async salaryHistory(
    @Param('id', ParseIntPipe) id: number,
    @Query() query: WorkerSalaryPaymentQueryDto,
  ): Promise<WorkerSalaryPaymentListResponseDto> {
    return this.workers.salaryHistory(id, query);
  }

  @Patch(':id')
  @ApiOkResponse({ type: WorkerViewDto })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateWorkerDto,
  ): Promise<WorkerViewDto> {
    return this.workers.update(id, dto);
  }

  @Delete(':id')
  @ApiOkResponse({
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
      },
    },
  })
  async softDelete(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<{ success: true }> {
    return this.workers.softDelete(id);
  }

  @Get(':id')
  @ApiOkResponse({ type: WorkerDetailsViewDto })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<WorkerDetailsViewDto> {
    return this.workers.findOne(id);
  }
}
