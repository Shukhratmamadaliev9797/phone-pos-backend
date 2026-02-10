import { UserResponseDto } from './dto/user-response.dto';
import { User } from './entities/user.entity';

export type UserView = UserResponseDto;

export function toUserResponse(user: User): UserResponseDto {
  return {
    id: user.id,
    username: user.username,
    fullName: user.fullName,
    email: user.email,
    phoneNumber: user.phoneNumber,
    address: user.address,
    role: user.role,
  };
}

export const userToView = toUserResponse;
