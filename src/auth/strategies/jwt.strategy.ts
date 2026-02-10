import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UserRole } from 'src/user/user/entities/user.entity';
import { UserService } from 'src/user/user/services/user.service';
import { tokenVersionMatches } from '../helper';

type JwtPayload = {
  sub: number;
  role: UserRole;
  tokenVersion: number;
};

export type JwtRequestUser = {
  id: number;
  sub: number;
  role: UserRole;
  tokenVersion: number;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    configService: ConfigService,
    private readonly users: UserService,
  ) {
    const secret = configService.get<string>('JWT_SECRET', { infer: true });
    if (!secret) {
      throw new Error('JWT_SECRET environment variable is required');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: JwtPayload): Promise<JwtRequestUser> {
    const user = await this.users.findActiveById(payload.sub).catch(() => null);

    if (!user) {
      throw new UnauthorizedException('Invalid token');
    }

    if (!tokenVersionMatches(payload.tokenVersion, user.refreshTokenVersion)) {
      throw new UnauthorizedException('Access token is expired');
    }

    return {
      id: payload.sub,
      sub: payload.sub,
      role: payload.role,
      tokenVersion: payload.tokenVersion,
    };
  }
}
