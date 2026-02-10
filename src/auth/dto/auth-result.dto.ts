import { ApiProperty } from '@nestjs/swagger';
import type { UserView } from 'src/user/user/helper';
import { UserResponseDto } from 'src/user/user/dto/user-response.dto';
import { AuthTokensDto } from './auth-tokens.dto';

export class AuthResultDto {
  @ApiProperty({ type: UserResponseDto })
  user: UserView;

  @ApiProperty({ type: AuthTokensDto })
  tokens: AuthTokensDto;
}
