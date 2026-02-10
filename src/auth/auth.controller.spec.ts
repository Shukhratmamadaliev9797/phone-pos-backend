import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthResultDto } from './dto/auth-result.dto';
import { AuthService } from './services/auth.service';
import { UserRole } from 'src/user/user/entities/user.entity';

describe('AuthController', () => {
  let controller: AuthController;
  const authServiceMock: Record<string, jest.Mock> = {
    register: jest.fn(),
    login: jest.fn(),
    refresh: jest.fn(),
    me: jest.fn(),
    logout: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: authServiceMock }],
    }).compile();

    controller = module.get<AuthController>(AuthController);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('register returns tokens and user view', async () => {
    const result: AuthResultDto = {
      user: {
        id: 1,
        username: 'cashier.1',
        fullName: 'Cashier One',
        role: UserRole.CASHIER,
      },
      tokens: {
        accessToken: 'access.token',
        refreshToken: 'refresh.token',
      },
    };
    authServiceMock.register.mockResolvedValue(result);

    const response = await controller.register({
      email: 'cashier.1@pos.local',
      password: 'WorkerPos123',
      fullName: 'Cashier One',
    });

    expect(authServiceMock.register).toHaveBeenCalledTimes(1);
    expect(response).toEqual(result);
  });

  it('login wrong password throws 401', async () => {
    authServiceMock.login.mockRejectedValue(
      new UnauthorizedException('Invalid credentials'),
    );

    await expect(
      controller.login({
        email: 'admin@pos.local',
        password: 'wrong-pass',
      }),
    ).rejects.toMatchObject({
      status: 401,
    });
  });

  it('refresh with mismatched tokenVersion throws 401', async () => {
    authServiceMock.refresh.mockRejectedValue(
      new UnauthorizedException('Invalid refresh token'),
    );

    await expect(
      controller.refresh({
        refreshToken: 'bad.refresh.token',
      }),
    ).rejects.toMatchObject({
      status: 401,
    });
  });

  it('logout delegates with current user id and returns success', async () => {
    authServiceMock.logout.mockResolvedValue({ success: true });

    const response = await controller.logout({
      id: 7,
      role: UserRole.CASHIER,
    } as any);

    expect(authServiceMock.logout).toHaveBeenCalledWith(7);
    expect(authServiceMock.logout).toHaveBeenCalledTimes(1);
    expect(response).toEqual({ success: true });
  });
});
