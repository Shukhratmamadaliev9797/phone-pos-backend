import { ApiProperty } from '@nestjs/swagger';
import { UserResponseDto } from 'src/user/user/dto/user-response.dto';
import { TokenResponseDto } from './token-response.dto';

export class AuthResponseDto {
  @ApiProperty({ type: UserResponseDto })
  user: UserResponseDto;

  @ApiProperty({ type: TokenResponseDto })
  auth: TokenResponseDto;
}
