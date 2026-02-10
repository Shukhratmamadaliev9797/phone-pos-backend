import { Injectable } from '@nestjs/common';
import { ReportsOverviewDto } from '../dto/reports-overview.dto';
import { ReportsOverviewService } from './reports-overview.service';

@Injectable()
export class ReportsService {
  constructor(private readonly reportsOverview: ReportsOverviewService) {}

  overview(): Promise<ReportsOverviewDto> {
    return this.reportsOverview.execute();
  }
}
