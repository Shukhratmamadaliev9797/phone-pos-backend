import { Injectable } from '@nestjs/common';
import { DashboardOverviewDto } from '../dto/dashboard-overview.dto';
import {
  DashboardKpiPeriod,
  DashboardOverviewService,
} from './dashboard-overview.service';

@Injectable()
export class DashboardService {
  constructor(private readonly dashboardOverview: DashboardOverviewService) {}

  overview(
    kpiPeriod?: DashboardKpiPeriod,
    from?: string,
    to?: string,
  ): Promise<DashboardOverviewDto> {
    return this.dashboardOverview.execute(kpiPeriod, from, to);
  }
}
