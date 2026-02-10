import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { paginateAndFilter } from 'src/common/pagination/paginate-and-filter';
import { Repository } from 'typeorm';
import { toUserResponse } from '../helper';
import { User } from '../entities/user.entity';
import { UserBaseService } from './user-base.service';

@Injectable()
export class UserFindAllService extends UserBaseService {
  constructor(
    @InjectRepository(User) usersRepository: Repository<User>,
  ) {
    super(usersRepository);
  }

  async execute(query: PaginationQueryDto) {
    const paginated = await paginateAndFilter(this.usersRepository, query, {
      isActive: true,
    });

    return {
      data: paginated.data.map(toUserResponse),
      meta: paginated.meta,
    };
  }
}
