import { Injectable } from '@nestjs/common';
import { RepairListQueryDto, RepairListResponseDto } from '../dto/repair-result.dto';
import { toRepairView } from '../helper';
import { RepairBaseService } from './repair-base.service';

@Injectable()
export class RepairFindAllService extends RepairBaseService {
  async execute(query: RepairListQueryDto): Promise<RepairListResponseDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    const builder = this.repairsRepository
      .createQueryBuilder('repair')
      .leftJoinAndSelect(
        'repair.item',
        'item',
        'item.isActive = :itemIsActive',
        { itemIsActive: true },
      )
      .leftJoinAndSelect(
        'repair.technician',
        'technician',
        'technician.isActive = :technicianIsActive',
        { technicianIsActive: true },
      )
      .where('repair.isActive = :isActive', { isActive: true })
      .orderBy('repair.id', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (query.status) {
      builder.andWhere('repair.status = :status', { status: query.status });
    }

    if (query.technicianId) {
      builder.andWhere('repair.technicianId = :technicianId', {
        technicianId: query.technicianId,
      });
    }

    if (query.search?.trim()) {
      builder.andWhere(
        '(repair.description ILIKE :q OR repair.notes ILIKE :q OR item.imei ILIKE :q OR item.brand ILIKE :q OR item.model ILIKE :q)',
        {
          q: `%${query.search.trim()}%`,
        },
      );
    }

    const [data, total] = await builder.getManyAndCount();

    return {
      data: data.map((repair) => toRepairView(repair)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }
}
