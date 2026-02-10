import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { StringValue } from 'ms';
import { User } from 'src/user/user/entities/user.entity';
import {
  AccessPayload,
  RefreshPayload,
  buildAccessPayload,
  buildRefreshPayload,
} from '../helper';

@Injectable()
export class AuthSigningService {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  private get accessSecret(): string {
    const value = this.config.get<string>('JWT_SECRET', { infer: true });
    if (!value) {
      throw new Error('JWT_SECRET environment variable is required');
    }
    return value;
  }

  private get refreshSecret(): string {
    const value = this.config.get<string>('JWT_REFRESH_SECRET', {
      infer: true,
    });
    if (!value) {
      throw new Error('JWT_REFRESH_SECRET environment variable is required');
    }
    return value;
  }

  private get accessExpires(): StringValue | number {
    return (
      this.config.get<StringValue>('JWT_ACCESS_EXPIRES', { infer: true }) ??
      this.config.get<StringValue>('JWT_EXPIRES', { infer: true }) ??
      '15m'
    ) as StringValue;
  }

  private get refreshExpires(): StringValue | number {
    return (
      this.config.get<StringValue>('JWT_REFRESH_EXPIRES', { infer: true }) ??
      '7d'
    ) as StringValue;
  }

  async signTokens(
    user: Pick<User, 'id' | 'role' | 'refreshTokenVersion'>,
  ): Promise<{ access_token: string; refresh_token: string }> {
    const accessPayload: AccessPayload = buildAccessPayload(user);
    const refreshPayload: RefreshPayload = buildRefreshPayload(user);

    const [access_token, refresh_token] = await Promise.all([
      this.jwt.signAsync(accessPayload, {
        secret: this.accessSecret,
        expiresIn: this.accessExpires,
      }),
      this.jwt.signAsync(refreshPayload, {
        secret: this.refreshSecret,
        expiresIn: this.refreshExpires,
      }),
    ]);

    return { access_token, refresh_token };
  }

  async verifyAccess(token: string): Promise<AccessPayload> {
    return this.jwt.verifyAsync<AccessPayload>(token, {
      secret: this.accessSecret,
    });
  }

  async verifyRefresh(token: string): Promise<RefreshPayload> {
    return this.jwt.verifyAsync<RefreshPayload>(token, {
      secret: this.refreshSecret,
    });
  }
}
