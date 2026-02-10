import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtRequestUser } from 'src/auth/strategies/jwt.strategy';
import { User } from 'src/user/user/entities/user.entity';
import { Repository } from 'typeorm';
import { CreateSupportRequestDto } from '../dto/create-support-request.dto';
import { SupportRequestViewDto } from '../dto/support-request-view.dto';
import { SupportRequest } from '../entities/support-request.entity';
import { toSupportRequestView } from '../helper';
import { SupportRequestBaseService } from './support-request-base.service';

@Injectable()
export class SupportRequestCreateService extends SupportRequestBaseService {
  constructor(
    @InjectRepository(SupportRequest)
    private readonly supportRequestsRepository: Repository<SupportRequest>,
    @InjectRepository(User)
    usersRepository: Repository<User>,
  ) {
    super(usersRepository);
  }

  async execute(
    currentUser: JwtRequestUser,
    dto: CreateSupportRequestDto,
  ): Promise<SupportRequestViewDto> {
    const user = await this.getActiveUserByIdOrThrow(currentUser.id);
    const supportRequest = this.supportRequestsRepository.create({
      senderUserId: user.id,
      senderUser: user,
      senderFullName: user.fullName,
      senderRole: user.role,
      message: dto.message.trim(),
    });

    const saved = await this.supportRequestsRepository.save(supportRequest);
    return toSupportRequestView(saved);
  }
}
