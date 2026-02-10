import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class LoginAuthDto {
  @ApiProperty({ example: 'owner.admin' })
  @IsString()
  @MinLength(3)
  @MaxLength(80)
  username: string;

  @ApiProperty({ example: 'StrongPass123' })
  @IsString()
  @MinLength(6)
  @MaxLength(64)
  password: string;
}
