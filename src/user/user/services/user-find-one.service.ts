import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { UserBaseService } from './user-base.service';

@Injectable()
export class UserFindOneService extends UserBaseService {
  constructor(
    @InjectRepository(User) usersRepository: Repository<User>,
  ) {
    super(usersRepository);
  }

  async execute(id: number) {
    const user = await this.usersRepository.findOne({
      where: { id, isActive: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }
}
