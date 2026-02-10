import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { UserFindOneService } from './user-find-one.service';
import { UserBaseService } from './user-base.service';

@Injectable()
export class UserSoftDeleteService extends UserBaseService {
  constructor(
    @InjectRepository(User) usersRepository: Repository<User>,
    private readonly findOneService: UserFindOneService,
  ) {
    super(usersRepository);
  }

  async execute(id: number) {
    const user = await this.findOneService.execute(id);

    user.isActive = false;
    user.deletedAt = new Date();

    await this.usersRepository.save(user);
  }
}
