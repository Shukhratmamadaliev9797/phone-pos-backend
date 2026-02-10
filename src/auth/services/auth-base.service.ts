import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/user/user/entities/user.entity';

@Injectable()
export class AuthBaseService {
  constructor(
    protected readonly config: ConfigService,
    @InjectRepository(User)
    protected readonly usersRepository: Repository<User>,
  ) {}

  protected get refreshSecret(): string {
    const value = this.config.get<string>('JWT_REFRESH_SECRET', {
      infer: true,
    });
    if (!value) {
      throw new Error('JWT_REFRESH_SECRET environment variable is required');
    }
    return value;
  }

  async getActiveUserByIdentifierOrThrow(identifier: string): Promise<User> {
    const normalized = identifier.trim().toLowerCase();
    const user = await this.usersRepository
      .createQueryBuilder('user')
      .addSelect(['user.passwordHash'])
      .where(
        '(LOWER(user.email) = :identifier OR LOWER(user.username) = :identifier)',
        {
          identifier: normalized,
        },
      )
      .andWhere('user.isActive = :isActive', { isActive: true })
      .getOne();

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return user;
  }

  async getActiveUserByIdOrThrow(id: number): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { id, isActive: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }
}
