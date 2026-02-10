import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRole } from 'src/user/user/entities/user.entity';
import type { JwtRequestUser } from 'src/auth/strategies/jwt.strategy';
import { CreateSupportRequestDto } from './dto/create-support-request.dto';
import {
  SupportRequestListResponseDto,
  SupportRequestQueryDto,
} from './dto/support-request-query.dto';
import { SupportRequestViewDto } from './dto/support-request-view.dto';
import { SupportRequestService } from './services/support-request.service';
import { UpdateSupportRequestStatusDto } from './dto/update-support-request-status.dto';

@ApiTags('Support Requests')
@ApiBearerAuth('access-token')
@Controller('api/support-requests')
export class SupportRequestController {
  constructor(private readonly supportRequests: SupportRequestService) {}

  @Get()
  @Roles(UserRole.OWNER_ADMIN)
  @ApiOkResponse({ type: SupportRequestListResponseDto })
  findAll(
    @Query() query: SupportRequestQueryDto,
  ): Promise<SupportRequestListResponseDto> {
    return this.supportRequests.findAll(query);
  }

  @Post()
  @Roles(
    UserRole.OWNER_ADMIN,
    UserRole.MANAGER,
    UserRole.CASHIER,
    UserRole.TECHNICIAN,
  )
  @ApiCreatedResponse({ type: SupportRequestViewDto })
  create(
    @CurrentUser() currentUser: JwtRequestUser,
    @Body() dto: CreateSupportRequestDto,
  ): Promise<SupportRequestViewDto> {
    return this.supportRequests.create(currentUser, dto);
  }

  @Patch(':id/status')
  @Roles(UserRole.OWNER_ADMIN)
  @ApiOkResponse({ type: SupportRequestViewDto })
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSupportRequestStatusDto,
    @CurrentUser() currentUser: JwtRequestUser,
  ): Promise<SupportRequestViewDto> {
    return this.supportRequests.updateStatus(id, dto, currentUser);
  }
}
