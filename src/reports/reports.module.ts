import { Module } from '@nestjs/common';
import { ReportsController } from './reports.controller';
import { ReportsOverviewService } from './services/reports-overview.service';
import { ReportsService } from './services/reports.service';

@Module({
  controllers: [ReportsController],
  providers: [ReportsOverviewService, ReportsService],
})
export class ReportsModule {}
