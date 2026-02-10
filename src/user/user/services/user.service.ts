import { Injectable } from '@nestjs/common';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { toUserResponse } from '../helper';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { UserFindAllService } from './user-find-all.service';
import { UserFindOneService } from './user-find-one.service';
import { UserCreateService } from './user-create.service';
import { UserUpdateService } from './user-update.service';
import { UserSoftDeleteService } from './user-soft-delete.service';
import { UserFindByUsernameService } from './user-find-by-username.service';
import { UserTokenVersionService } from './user-token-version.service';

@Injectable()
export class UserService {
  constructor(
    private readonly findAllService: UserFindAllService,
    private readonly findOneService: UserFindOneService,
    private readonly createService: UserCreateService,
    private readonly updateService: UserUpdateService,
    private readonly softDeleteService: UserSoftDeleteService,
    private readonly findByUsernameService: UserFindByUsernameService,
    private readonly tokenVersionService: UserTokenVersionService,
  ) {}

  async findAll(query: PaginationQueryDto) {
    return this.findAllService.execute(query);
  }

  async findOne(id: number) {
    const user = await this.findOneService.execute(id);
    return toUserResponse(user);
  }

  async create(dto: CreateUserDto) {
    const user = await this.createService.execute(dto);
    return toUserResponse(user);
  }

  async update(id: number, dto: UpdateUserDto) {
    const user = await this.updateService.execute(id, dto);
    return toUserResponse(user);
  }

  async softDelete(id: number) {
    return this.softDeleteService.execute(id);
  }

  async findActiveById(id: number) {
    return this.findOneService.execute(id);
  }

  async findActiveByUsername(username: string, includePassword = false) {
    return this.findByUsernameService.execute(username, includePassword);
  }

  async bumpRefreshTokenVersion(id: number) {
    return this.tokenVersionService.bump(id);
  }
}
