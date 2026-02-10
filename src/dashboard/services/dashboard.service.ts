import { Injectable } from '@nestjs/common';
import { DashboardOverviewDto } from '../dto/dashboard-overview.dto';
import { DashboardOverviewService } from './dashboard-overview.service';

@Injectable()
export class DashboardService {
  constructor(private readonly dashboardOverview: DashboardOverviewService) {}

  overview(): Promise<DashboardOverviewDto> {
    return this.dashboardOverview.execute();
  }
}
