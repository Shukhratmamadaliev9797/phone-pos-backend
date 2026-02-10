import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { UpdateUserDto } from '../dto/update-user.dto';
import { User } from '../entities/user.entity';
import { UserFindOneService } from './user-find-one.service';
import { UserBaseService } from './user-base.service';

@Injectable()
export class UserUpdateService extends UserBaseService {
  constructor(
    @InjectRepository(User) usersRepository: Repository<User>,
    private readonly findOneService: UserFindOneService,
  ) {
    super(usersRepository);
  }

  async execute(id: number, dto: UpdateUserDto) {
    const user = await this.findOneService.execute(id);

    if (dto.fullName !== undefined) user.fullName = dto.fullName;
    if (dto.email !== undefined) user.email = dto.email;
    if (dto.phoneNumber !== undefined) user.phoneNumber = dto.phoneNumber;
    if (dto.address !== undefined) user.address = dto.address;
    if (dto.role !== undefined) user.role = dto.role;

    if (dto.password !== undefined) {
      user.passwordHash = await bcrypt.hash(dto.password, 10);
      user.refreshTokenVersion += 1;
    }

    return this.usersRepository.save(user);
  }
}
