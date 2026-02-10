import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { UserBaseService } from './user-base.service';

@Injectable()
export class UserFindByUsernameService extends UserBaseService {
  constructor(
    @InjectRepository(User) usersRepository: Repository<User>,
  ) {
    super(usersRepository);
  }

  async execute(username: string, includePassword = false) {
    return this.usersRepository.findOne({
      where: { username, isActive: true },
      select: {
        id: true,
        username: true,
        fullName: true,
        role: true,
        refreshTokenVersion: true,
        passwordHash: includePassword,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        deletedAt: true,
      },
    });
  }
}
