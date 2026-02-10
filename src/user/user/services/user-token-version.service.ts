import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { UserBaseService } from './user-base.service';

@Injectable()
export class UserTokenVersionService extends UserBaseService {
  constructor(
    @InjectRepository(User) usersRepository: Repository<User>,
  ) {
    super(usersRepository);
  }

  async bump(id: number): Promise<void> {
    const result = await this.usersRepository.increment(
      { id, isActive: true },
      'refreshTokenVersion',
      1,
    );

    if (!result.affected) {
      throw new NotFoundException('User not found');
    }
  }
}
