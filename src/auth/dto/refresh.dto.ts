import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsString } from 'class-validator';

export class RefreshDto {
  @ApiProperty()
  @Transform(({ value, obj }) => value ?? obj?.refresh_token)
  @IsString()
  refreshToken: string;
}
