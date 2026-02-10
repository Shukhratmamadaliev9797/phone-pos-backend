import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/user/user/entities/user.entity';
import { SupportRequest } from './entities/support-request.entity';
import { SupportRequestController } from './support-request.controller';
import { SupportRequestBaseService } from './services/support-request-base.service';
import { SupportRequestCreateService } from './services/support-request-create.service';
import { SupportRequestFindAllService } from './services/support-request-find-all.service';
import { SupportRequestService } from './services/support-request.service';
import { SupportRequestUpdateStatusService } from './services/support-request-update-status.service';

@Module({
  imports: [TypeOrmModule.forFeature([SupportRequest, User])],
  controllers: [SupportRequestController],
  providers: [
    SupportRequestBaseService,
    SupportRequestCreateService,
    SupportRequestFindAllService,
    SupportRequestUpdateStatusService,
    SupportRequestService,
  ],
  exports: [SupportRequestService],
})
export class SupportRequestModule {}
