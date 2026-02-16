import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardController } from './dashboard.controller';
import { DashboardMetric } from './entities/dashboard-metric.entity';
import { DashboardOverviewService } from './services/dashboard-overview.service';
import { DashboardService } from './services/dashboard.service';

@Module({
  imports: [TypeOrmModule.forFeature([DashboardMetric])],
  controllers: [DashboardController],
  providers: [DashboardOverviewService, DashboardService],
})
export class DashboardModule {}
