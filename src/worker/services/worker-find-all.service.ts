import { Injectable } from '@nestjs/common';
import { WorkerQueryDto } from '../dto/worker-query.dto';
import { WorkerListResponseDto } from '../dto/worker-result.dto';
import { toWorkerView } from '../helper';
import { WorkerBaseService } from './worker-base.service';

@Injectable()
export class WorkerFindAllService extends WorkerBaseService {
  async execute(query: WorkerQueryDto): Promise<WorkerListResponseDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    const builder = this.workersRepository
      .createQueryBuilder('worker')
      .leftJoinAndSelect('worker.user', 'user', 'user.isActive = :userIsActive', {
        userIsActive: true,
      })
      .where('worker.isActive = :isActive', { isActive: true })
      .orderBy('worker.id', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (query.search?.trim()) {
      builder.andWhere(
        '(worker.fullName ILIKE :search OR worker.phoneNumber ILIKE :search)',
        {
          search: `%${query.search.trim()}%`,
        },
      );
    }

    if (query.workerRole) {
      builder.andWhere('worker.workerRole = :workerRole', {
        workerRole: query.workerRole,
      });
    }

    if (query.hasDashboardAccess !== undefined) {
      builder.andWhere('worker.hasDashboardAccess = :hasDashboardAccess', {
        hasDashboardAccess: query.hasDashboardAccess,
      });
    }

    const [data, total] = await builder.getManyAndCount();

    return {
      data: data.map(toWorkerView),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }
}
