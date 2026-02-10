import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import type { StringValue } from 'ms';
import { UserModule } from 'src/user/user/user.module';
import { User } from 'src/user/user/entities/user.entity';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { AuthBaseService } from './services/auth-base.service';
import { AuthLoginService } from './services/auth-login.service';
import { AuthLogoutService } from './services/auth-logout.service';
import { AuthRefreshService } from './services/auth-refresh.service';
import { AuthRegisterService } from './services/auth-register.service';
import { AuthService } from './services/auth.service';
import { AuthSigningService } from './services/auth-signing.service';

@Module({
  imports: [
    ConfigModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const secret = config.get<string>('JWT_SECRET', { infer: true });
        const expiresIn =
          (config.get<StringValue>('JWT_ACCESS_EXPIRES', { infer: true }) ??
            '15m') as StringValue;

        if (!secret) {
          throw new Error('JWT_SECRET environment variable is required');
        }

        return {
          secret,
          signOptions: {
            expiresIn,
          },
        };
      },
    }),
    TypeOrmModule.forFeature([User]),
    UserModule,
  ],
  controllers: [AuthController],
  providers: [
    JwtStrategy,
    AuthBaseService,
    AuthRegisterService,
    AuthLoginService,
    AuthRefreshService,
    AuthLogoutService,
    AuthSigningService,
    AuthService,
  ],
  exports: [AuthService, PassportModule],
})
export class AuthModule {}
