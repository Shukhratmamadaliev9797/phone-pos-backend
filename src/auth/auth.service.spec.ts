import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from 'src/user/user/entities/user.entity';
import { AuthLoginService } from './services/auth-login.service';
import { AuthLogoutService } from './services/auth-logout.service';
import { AuthRefreshService } from './services/auth-refresh.service';
import { AuthRegisterService } from './services/auth-register.service';
import { AuthService } from './services/auth.service';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: ConfigService,
          useValue: { get: jest.fn() },
        },
        {
          provide: AuthRefreshService,
          useValue: { refresh: jest.fn() },
        },
        {
          provide: AuthRegisterService,
          useValue: { register: jest.fn() },
        },
        {
          provide: AuthLoginService,
          useValue: { login: jest.fn() },
        },
        {
          provide: AuthLogoutService,
          useValue: { logout: jest.fn() },
        },
        {
          provide: getRepositoryToken(User),
          useValue: { findOne: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
