import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardOverviewService } from './services/dashboard-overview.service';
import { DashboardService } from './services/dashboard.service';

@Module({
  controllers: [DashboardController],
  providers: [DashboardOverviewService, DashboardService],
})
export class DashboardModule {}
