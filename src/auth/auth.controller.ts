import {
  Body,
  Controller,
  Get,
  Post,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { UserResponseDto } from 'src/user/user/dto/user-response.dto';
import { User } from 'src/user/user/entities/user.entity';
import { Public } from './decorators/public.decorator';
import { AuthResultDto } from './dto/auth-result.dto';
import { LoginDto } from './dto/login.dto';
import { LogoutResultDto } from './dto/logout-result.dto';
import { RefreshDto } from './dto/refresh.dto';
import { RegisterDto } from './dto/register.dto';
import { AuthService } from './services/auth.service';

@ApiTags('Auth')
@Controller('api/auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Post('register')
  @ApiBody({ type: RegisterDto })
  @ApiCreatedResponse({ type: AuthResultDto })
  async register(@Body() dto: RegisterDto): Promise<AuthResultDto> {
    return this.auth.register(dto);
  }

  @Public()
  @Post('login')
  @ApiBody({ type: LoginDto })
  @ApiOkResponse({ type: AuthResultDto })
  async login(@Body() dto: LoginDto): Promise<AuthResultDto> {
    return this.auth.login(dto);
  }

  @Public()
  @Post('refresh')
  @ApiBody({ type: RefreshDto })
  @ApiOkResponse({ type: AuthResultDto })
  async refresh(@Body() dto: RefreshDto): Promise<AuthResultDto> {
    return this.auth.refresh(dto);
  }

  @Post('logout')
  @ApiBearerAuth()
  @ApiOkResponse({ type: LogoutResultDto })
  async logout(@CurrentUser() user: User): Promise<LogoutResultDto> {
    return this.auth.logout(user.id);
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOkResponse({ type: UserResponseDto })
  async me(@CurrentUser() user: User): Promise<UserResponseDto> {
    return this.auth.me(user);
  }
}
