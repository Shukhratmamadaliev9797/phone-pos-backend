import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';

export class CustomerQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Partial search by phoneNumber or fullName',
  })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  search?: string;
}
