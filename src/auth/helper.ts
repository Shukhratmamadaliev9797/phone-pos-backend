import * as bcrypt from 'bcrypt';
import { AuthResultDto } from './dto/auth-result.dto';
import { UserRole } from 'src/user/user/entities/user.entity';
import { UserView, userToView } from 'src/user/user/helper';

const DEFAULT_BCRYPT_ROUNDS = 10;

type AuthUserLike = {
  id: number;
  role: UserRole;
  refreshTokenVersion?: number;
};

type AuthTokensLike =
  | { accessToken: string; refreshToken: string }
  | { access_token: string; refresh_token: string };

export interface AccessPayload {
  sub: number;
  role: UserRole;
  tokenVersion: number;
  iat?: number;
  exp?: number;
}

export interface RefreshPayload {
  sub: number;
  tokenVersion: number;
  iat?: number;
  exp?: number;
}

function getBcryptRounds(): number {
  const rawRounds = process.env.BCRYPT_ROUNDS;
  const rounds = Number(rawRounds);
  if (Number.isInteger(rounds) && rounds > 0) {
    return rounds;
  }
  return DEFAULT_BCRYPT_ROUNDS;
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, getBcryptRounds());
}

export async function verifyPassword(
  plain: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export function buildAccessPayload(user: AuthUserLike): AccessPayload {
  return {
    sub: user.id,
    role: user.role,
    tokenVersion: user.refreshTokenVersion ?? 0,
  };
}

export function buildRefreshPayload(user: AuthUserLike): RefreshPayload {
  return {
    sub: user.id,
    tokenVersion: user.refreshTokenVersion ?? 0,
  };
}

export function toAuthResult(
  user: Parameters<typeof userToView>[0],
  tokens: AuthTokensLike,
): AuthResultDto {
  const normalizedTokens =
    'accessToken' in tokens
      ? tokens
      : {
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
        };

  return {
    user: userToView(user) as UserView,
    tokens: normalizedTokens,
  };
}

export function tokenVersionMatches(
  payloadVersion: number | undefined,
  userVersion: number | undefined,
): boolean {
  return (payloadVersion ?? 0) === (userVersion ?? 0);
}
