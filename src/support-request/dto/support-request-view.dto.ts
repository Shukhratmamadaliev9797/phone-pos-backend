import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from 'src/user/user/entities/user.entity';

export class SupportRequestViewDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  senderUserId: number | null;

  @ApiProperty()
  senderFullName: string;

  @ApiProperty({ enum: UserRole })
  senderRole: UserRole;

  @ApiProperty()
  message: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  isRead: boolean;

  @ApiProperty({ nullable: true })
  readAt: Date | null;

  @ApiProperty({ nullable: true })
  readByAdminId: number | null;
}
