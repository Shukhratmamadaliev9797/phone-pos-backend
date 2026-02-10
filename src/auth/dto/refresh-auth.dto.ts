import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class RefreshAuthDto {
  @ApiProperty()
  @IsString()
  refresh_token: string;
}
