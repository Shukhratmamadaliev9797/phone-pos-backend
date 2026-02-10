import {
  FindOptionsOrder,
  FindOptionsWhere,
  ObjectLiteral,
  Repository,
} from 'typeorm';
import { PaginationQueryDto } from '../dto/pagination-query.dto';

export type PaginatedResult<T> = {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};

export async function paginateAndFilter<T extends ObjectLiteral>(
  repository: Repository<T>,
  pagination: PaginationQueryDto,
  where: FindOptionsWhere<T>,
): Promise<PaginatedResult<T>> {
  const page = pagination.page ?? 1;
  const limit = pagination.limit ?? 10;
  const [data, total] = await repository.findAndCount({
    where,
    skip: (page - 1) * limit,
    take: limit,
    order: ({ id: 'DESC' } as unknown) as FindOptionsOrder<T>,
  });

  return {
    data,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  };
}
