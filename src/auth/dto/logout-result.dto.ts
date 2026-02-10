import { ApiProperty } from '@nestjs/swagger';
import { Equals } from 'class-validator';

export class LogoutResultDto {
  @ApiProperty({ example: true, enum: [true] })
  @Equals(true)
  success: true;
}
