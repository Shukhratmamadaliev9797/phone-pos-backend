import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRole } from 'src/user/user/entities/user.entity';
import { DashboardOverviewDto } from './dto/dashboard-overview.dto';
import { DashboardService } from './services/dashboard.service';

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
  async overview(): Promise<DashboardOverviewDto> {
    return this.dashboardService.overview();
  }
}
