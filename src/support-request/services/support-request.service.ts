import { Injectable } from '@nestjs/common';
import { JwtRequestUser } from 'src/auth/strategies/jwt.strategy';
import { CreateSupportRequestDto } from '../dto/create-support-request.dto';
import {
  SupportRequestListResponseDto,
  SupportRequestQueryDto,
} from '../dto/support-request-query.dto';
import { SupportRequestViewDto } from '../dto/support-request-view.dto';
import { SupportRequestCreateService } from './support-request-create.service';
import { SupportRequestFindAllService } from './support-request-find-all.service';
import { SupportRequestUpdateStatusService } from './support-request-update-status.service';
import { UpdateSupportRequestStatusDto } from '../dto/update-support-request-status.dto';

@Injectable()
export class SupportRequestService {
  constructor(
    private readonly createService: SupportRequestCreateService,
    private readonly findAllService: SupportRequestFindAllService,
    private readonly updateStatusService: SupportRequestUpdateStatusService,
  ) {}

  findAll(query: SupportRequestQueryDto): Promise<SupportRequestListResponseDto> {
    return this.findAllService.execute(query);
  }

  create(
    currentUser: JwtRequestUser,
    dto: CreateSupportRequestDto,
  ): Promise<SupportRequestViewDto> {
    return this.createService.execute(currentUser, dto);
  }

  updateStatus(
    id: number,
    dto: UpdateSupportRequestStatusDto,
    currentUser: JwtRequestUser,
  ): Promise<SupportRequestViewDto> {
    return this.updateStatusService.execute(id, dto, currentUser);
  }
}
