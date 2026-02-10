import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { SupportRequestViewDto } from './support-request-view.dto';

export class SupportRequestQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Search by sender full name or message',
  })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  search?: string;

  @ApiPropertyOptional({
    description: 'Optional text in YYYY-MM-DD format for filtering by date',
  })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  createdDate?: string;

  @ApiPropertyOptional({
    enum: ['all', 'read', 'unread'],
    default: 'all',
  })
  @IsOptional()
  @IsIn(['all', 'read', 'unread'])
  status?: 'all' | 'read' | 'unread';
}

export class SupportRequestListMetaDto {
  @ApiPropertyOptional()
  @Type(() => Number)
  total: number;

  @ApiPropertyOptional()
  @Type(() => Number)
  page: number;

  @ApiPropertyOptional()
  @Type(() => Number)
  limit: number;

  @ApiPropertyOptional()
  @Type(() => Number)
  totalPages: number;
}

export class SupportRequestListResponseDto {
  @ApiPropertyOptional({ type: [SupportRequestViewDto] })
  data: SupportRequestViewDto[];

  @ApiPropertyOptional({ type: SupportRequestListMetaDto })
  meta: SupportRequestListMetaDto;
}
