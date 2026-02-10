import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  SupportRequestListResponseDto,
  SupportRequestQueryDto,
} from '../dto/support-request-query.dto';
import { SupportRequest } from '../entities/support-request.entity';
import { toSupportRequestView } from '../helper';

@Injectable()
export class SupportRequestFindAllService {
  constructor(
    @InjectRepository(SupportRequest)
    private readonly supportRequestsRepository: Repository<SupportRequest>,
  ) {}

  async execute(
    query: SupportRequestQueryDto,
  ): Promise<SupportRequestListResponseDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    const qb = this.supportRequestsRepository
      .createQueryBuilder('request')
      .where('request.isActive = :isActive', { isActive: true });

    if (query.search?.trim()) {
      const search = `%${query.search.trim()}%`;
      qb.andWhere(
        '(request.senderFullName ILIKE :search OR request.message ILIKE :search)',
        { search },
      );
    }

    if (query.createdDate?.trim()) {
      qb.andWhere('DATE(request.createdAt) = :createdDate', {
        createdDate: query.createdDate.trim(),
      });
    }

    if (query.status === 'read') {
      qb.andWhere('request.isRead = true');
    }
    if (query.status === 'unread') {
      qb.andWhere('request.isRead = false');
    }

    const [rows, total] = await qb
      .orderBy('request.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      data: rows.map(toSupportRequestView),
      meta: {
        total,
        page,
        limit,
        totalPages: total > 0 ? Math.ceil(total / limit) : 1,
      },
    };
  }
}
