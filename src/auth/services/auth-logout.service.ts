import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LogoutResultDto } from '../dto/logout-result.dto';
import { AuthBaseService } from './auth-base.service';
import { User } from 'src/user/user/entities/user.entity';

@Injectable()
export class AuthLogoutService extends AuthBaseService {
  constructor(
    config: ConfigService,
    @InjectRepository(User) usersRepository: Repository<User>,
  ) {
    super(config, usersRepository);
  }

  async logout(currentUserId: number): Promise<LogoutResultDto> {
    await this.usersRepository.increment(
      { id: currentUserId, isActive: true },
      'refreshTokenVersion',
      1,
    );

    return { success: true };
  }
}
