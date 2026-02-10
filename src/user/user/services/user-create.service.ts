import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { CreateUserDto } from '../dto/create-user.dto';
import { User } from '../entities/user.entity';
import { UserBaseService } from './user-base.service';

@Injectable()
export class UserCreateService extends UserBaseService {
  constructor(
    @InjectRepository(User) usersRepository: Repository<User>,
  ) {
    super(usersRepository);
  }

  async execute(dto: CreateUserDto) {
    const exists = await this.usersRepository.findOne({
      where: { username: dto.username },
      withDeleted: true,
    });

    if (exists) {
      throw new BadRequestException('Username already exists');
    }

    if (dto.email) {
      const emailExists = await this.usersRepository.findOne({
        where: { email: dto.email },
        withDeleted: true,
      });
      if (emailExists) {
        throw new BadRequestException('Email already exists');
      }
    }

    const hash = await bcrypt.hash(dto.password, 10);
    const user = this.usersRepository.create({
      email: dto.email ?? null,
      username: dto.username,
      fullName: dto.fullName,
      phoneNumber: dto.phoneNumber ?? null,
      address: dto.address ?? null,
      passwordHash: hash,
      role: dto.role,
      isActive: true,
      deletedAt: null,
    });

    return this.usersRepository.save(user);
  }
}
