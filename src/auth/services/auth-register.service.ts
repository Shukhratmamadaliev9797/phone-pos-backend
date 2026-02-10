import { ConflictException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthResultDto } from '../dto/auth-result.dto';
import { RegisterDto } from '../dto/register.dto';
import { hashPassword, toAuthResult } from '../helper';
import { User, UserRole } from 'src/user/user/entities/user.entity';
import { AuthBaseService } from './auth-base.service';
import { AuthSigningService } from './auth-signing.service';

@Injectable()
export class AuthRegisterService extends AuthBaseService {
  constructor(
    config: ConfigService,
    @InjectRepository(User) usersRepository: Repository<User>,
    private readonly signing: AuthSigningService,
  ) {
    super(config, usersRepository);
  }

  async register(dto: RegisterDto): Promise<AuthResultDto> {
    const existing = await this.usersRepository.findOne({
      where: { email: dto.email, isActive: true },
    });

    if (existing) {
      throw new ConflictException('Email already exists');
    }

    const passwordHash = await hashPassword(dto.password);

    const user = this.usersRepository.create({
      email: dto.email,
      username: dto.email,
      fullName: dto.fullName,
      phoneNumber: dto.phoneNumber ?? null,
      address: dto.address ?? null,
      passwordHash,
      role: UserRole.CASHIER,
      refreshTokenVersion: 0,
      isActive: true,
      deletedAt: null,
    });

    const saved = await this.usersRepository.save(user);
    const tokens = await this.signing.signTokens(saved);

    return toAuthResult(saved, tokens);
  }
}
