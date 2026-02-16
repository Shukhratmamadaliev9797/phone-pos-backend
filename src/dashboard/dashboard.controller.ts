import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRole } from 'src/user/user/entities/user.entity';
import { DashboardOverviewDto } from './dto/dashboard-overview.dto';
import { DashboardService } from './services/dashboard.service';
import { DashboardKpiPeriod } from './services/dashboard-overview.service';

@ApiTags('Dashboard')
@ApiBearerAuth('access-token')
@Controller('api/dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('overview')
  @Roles(
    UserRole.OWNER_ADMIN,
    UserRole.MANAGER,
    UserRole.CASHIER,
    UserRole.TECHNICIAN,
  )
  @ApiOkResponse({ type: DashboardOverviewDto })
  async overview(
    @Query('kpiPeriod') kpiPeriod?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ): Promise<DashboardOverviewDto> {
    const allowed = new Set<DashboardKpiPeriod>([
      'daily',
      'weekly',
      'monthly',
      'custom',
    ]);
    const parsed = allowed.has((kpiPeriod ?? '') as DashboardKpiPeriod)
      ? (kpiPeriod as DashboardKpiPeriod)
      : 'monthly';
    return this.dashboardService.overview(parsed, from, to);
  }
}
