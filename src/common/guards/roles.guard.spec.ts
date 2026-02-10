import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ExecutionContext } from '@nestjs/common';
import { UserRole } from 'src/user/user/entities/user.entity';
import { RolesGuard } from './roles.guard';

describe('RolesGuard', () => {
  function createContext(user?: { role: UserRole }): ExecutionContext {
    return {
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
      getHandler: () => ({}),
      getClass: () => class TestClass {},
    } as ExecutionContext;
  }

  it('denies wrong role', () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue([UserRole.OWNER_ADMIN]),
    } as unknown as Reflector;

    const guard = new RolesGuard(reflector);

    expect(() =>
      guard.canActivate(createContext({ role: UserRole.CASHIER })),
    ).toThrow(ForbiddenException);
  });

  it('allows correct role', () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue([UserRole.MANAGER]),
    } as unknown as Reflector;

    const guard = new RolesGuard(reflector);

    expect(
      guard.canActivate(createContext({ role: UserRole.MANAGER })),
    ).toBe(true);
  });

  it('throws unauthorized when user is missing', () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue([UserRole.MANAGER]),
    } as unknown as Reflector;

    const guard = new RolesGuard(reflector);

    expect(() => guard.canActivate(createContext())).toThrow(UnauthorizedException);
  });
});
