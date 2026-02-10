import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { JwtRequestUser } from 'src/auth/strategies/jwt.strategy';
import { User } from 'src/user/user/entities/user.entity';
import { Repository } from 'typeorm';
import { UpdateSupportRequestStatusDto } from '../dto/update-support-request-status.dto';
import { SupportRequestViewDto } from '../dto/support-request-view.dto';
import { SupportRequest } from '../entities/support-request.entity';
import { toSupportRequestView } from '../helper';

@Injectable()
export class SupportRequestUpdateStatusService {
  constructor(
    @InjectRepository(SupportRequest)
    private readonly supportRequestsRepository: Repository<SupportRequest>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async execute(
    id: number,
    dto: UpdateSupportRequestStatusDto,
    currentUser: JwtRequestUser,
  ): Promise<SupportRequestViewDto> {
    const supportRequest = await this.supportRequestsRepository.findOne({
      where: { id, isActive: true },
    });

    if (!supportRequest) {
      throw new NotFoundException('Support request not found');
    }

    if (dto.isRead) {
      const admin = await this.usersRepository.findOne({
        where: { id: currentUser.id, isActive: true },
      });
      supportRequest.isRead = true;
      supportRequest.readAt = new Date();
      supportRequest.readByAdminId = admin?.id ?? null;
      supportRequest.readByAdmin = admin ?? null;
    } else {
      supportRequest.isRead = false;
      supportRequest.readAt = null;
      supportRequest.readByAdminId = null;
      supportRequest.readByAdmin = null;
    }

    const saved = await this.supportRequestsRepository.save(supportRequest);
    return toSupportRequestView(saved);
  }
}

