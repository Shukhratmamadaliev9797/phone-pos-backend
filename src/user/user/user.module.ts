import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserController } from './user.controller';
import { User } from './entities/user.entity';
import { UserFindAllService } from './services/user-find-all.service';
import { UserFindOneService } from './services/user-find-one.service';
import { UserCreateService } from './services/user-create.service';
import { UserUpdateService } from './services/user-update.service';
import { UserSoftDeleteService } from './services/user-soft-delete.service';
import { UserService } from './services/user.service';
import { UserFindByUsernameService } from './services/user-find-by-username.service';
import { UserTokenVersionService } from './services/user-token-version.service';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [UserController],
  providers: [
    UserFindAllService,
    UserFindOneService,
    UserCreateService,
    UserUpdateService,
    UserSoftDeleteService,
    UserFindByUsernameService,
    UserTokenVersionService,
    UserService,
  ],
  exports: [UserService],
})
export class UserModule {}
