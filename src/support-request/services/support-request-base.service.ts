import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/user/user/entities/user.entity';
import { Repository } from 'typeorm';

@Injectable()
export class SupportRequestBaseService {
  constructor(
    @InjectRepository(User)
    protected readonly usersRepository: Repository<User>,
  ) {}

  async getActiveUserByIdOrThrow(id: number): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { id, isActive: true },
    });

    if (!user) {
      throw new UnauthorizedException('User is not active');
    }

    return user;
  }
}

