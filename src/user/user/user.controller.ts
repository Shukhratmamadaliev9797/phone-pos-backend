import {
  Body,
  Controller,
  Delete,
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
  ApiNoContentResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { Roles } from 'src/common/decorators/roles.decorator';
import { CreateUserDto } from './dto/create-user.dto';
import { FindAllUsersResponseDto } from './dto/find-all-users-response.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { UserRole } from './entities/user.entity';
import { UserService } from './services/user.service';

@ApiTags('Users')
@ApiBearerAuth('access-token')
@Controller('api/users')
export class UserController {
  constructor(private readonly users: UserService) {}

  @Get()
  @Roles(UserRole.OWNER_ADMIN, UserRole.MANAGER)
  @ApiOkResponse({ type: FindAllUsersResponseDto })
  async findAll(@Query() query: PaginationQueryDto) {
    return this.users.findAll(query);
  }

  @Get(':id')
  @Roles(UserRole.OWNER_ADMIN, UserRole.MANAGER)
  @ApiOkResponse({ type: UserResponseDto })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.users.findOne(id);
  }

  @Post()
  @Roles(UserRole.OWNER_ADMIN)
  @ApiCreatedResponse({ type: UserResponseDto })
  async create(@Body() dto: CreateUserDto) {
    return this.users.create(dto);
  }

  @Patch(':id')
  @Roles(UserRole.OWNER_ADMIN, UserRole.MANAGER)
  @ApiOkResponse({ type: UserResponseDto })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserDto,
  ) {
    return this.users.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.OWNER_ADMIN)
  @ApiNoContentResponse()
  async softDelete(@Param('id', ParseIntPipe) id: number) {
    await this.users.softDelete(id);
  }
}
