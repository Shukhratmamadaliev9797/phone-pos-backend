import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsOptional, IsString } from 'class-validator';

export enum LoginRole {
  ADMIN = 'ADMIN',
  CASHIER = 'CASHIER',
  TECHNICIAN = 'TECHNICIAN',
}

export class LoginDto {
  @ApiProperty({
    example: 'admin@pos.local',
    description: 'Email or username (preferred field)',
    required: false,
  })
  @IsOptional()
  @IsString()
  identifier?: string;

  @ApiProperty({
    example: 'admin@pos.local',
    description: 'Backward compatibility: email login field',
    required: false,
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({
    example: 'admin',
    description: 'Backward compatibility: username login field',
    required: false,
  })
  @IsOptional()
  @IsString()
  username?: string;

  @ApiProperty({ example: 'StrongPass123' })
  @IsString()
  password: string;

  @ApiProperty({ enum: LoginRole, example: LoginRole.ADMIN })
  @IsEnum(LoginRole)
  role: LoginRole;
}
