import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRole } from 'src/user/user/entities/user.entity';
import { ReportsOverviewDto } from './dto/reports-overview.dto';
import { ReportsService } from './services/reports.service';

@ApiTags('Reports')
@ApiBearerAuth('access-token')
@Controller('api/reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('overview')
  @Roles(
    UserRole.OWNER_ADMIN,
    UserRole.MANAGER,
    UserRole.CASHIER,
    UserRole.TECHNICIAN,
  )
  @ApiOkResponse({ type: ReportsOverviewDto })
  async overview(): Promise<ReportsOverviewDto> {
    return this.reportsService.overview();
  }
}
