import { Injectable } from '@nestjs/common';
import { UserService } from 'src/user/user/services/user.service';
import { verifyPassword } from '../helper';

@Injectable()
export class AuthValidateService {
  constructor(private readonly users: UserService) {}

  async validateUser(username: string, password: string) {
    const user = await this.users.findActiveByUsername(username, true);
    if (!user) {
      return null;
    }

    const isPasswordCorrect = await verifyPassword(password, user.passwordHash);
    return isPasswordCorrect ? user : null;
  }
}
