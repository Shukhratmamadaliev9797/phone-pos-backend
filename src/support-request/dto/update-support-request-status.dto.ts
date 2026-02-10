import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class UpdateSupportRequestStatusDto {
  @ApiProperty()
  @IsBoolean()
  isRead: boolean;
}

