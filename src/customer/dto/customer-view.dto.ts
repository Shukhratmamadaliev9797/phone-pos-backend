import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CustomerViewDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  fullName: string;

  @ApiProperty()
  phoneNumber: string;

  @ApiPropertyOptional()
  address?: string | null;

  @ApiPropertyOptional()
  passportId?: string | null;

  @ApiPropertyOptional()
  notes?: string | null;
}
