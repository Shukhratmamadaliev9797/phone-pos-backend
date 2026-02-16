import {
  BadRequestException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthResultDto } from '../dto/auth-result.dto';
import { LoginDto } from '../dto/login.dto';
import { toAuthResult, verifyPassword } from '../helper';
import { AuthBaseService } from './auth-base.service';
import { AuthSigningService } from './auth-signing.service';
import { User } from 'src/user/user/entities/user.entity';

@Injectable()
export class AuthLoginService extends AuthBaseService {
  private readonly logger = new Logger(AuthLoginService.name);

  constructor(
    config: ConfigService,
    @InjectRepository(User) usersRepository: Repository<User>,
    private readonly signing: AuthSigningService,
  ) {
    super(config, usersRepository);
  }

  async login(dto: LoginDto): Promise<AuthResultDto> {
    const identifier = dto.identifier ?? dto.email ?? dto.username;
    if (!identifier || identifier.trim().length === 0) {
      throw new BadRequestException('identifier (or email/username) is required');
    }

    this.logger.debug(`Login attempt for identifier: ${identifier}`);

    const user = await this.getActiveUserByIdentifierOrThrow(identifier);
    this.logger.debug(
      `Active user found: id=${user.id}, role=${user.role}, isActive=${user.isActive}`,
    );

    const hash = user.passwordHash;
    this.logger.debug(`Password hash exists: ${Boolean(hash)}`);

    const isPasswordValid = hash
      ? await verifyPassword(dto.password, hash)
      : false;
    this.logger.debug(`Password valid: ${isPasswordValid}`);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    user.lastLoginAt = new Date();
    const saved = await this.usersRepository.save(user);
    const tokens = await this.signing.signTokens(saved);

    return toAuthResult(saved, tokens);
  }
}
