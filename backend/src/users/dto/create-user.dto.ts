import {
  IsString,
  IsEmail,
  IsOptional,
  MinLength,
  IsNotEmpty,
  IsEnum,
  IsUUID,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '@prisma/client';

export class CreateUserDto {
  @ApiProperty({ example: 'colaborador@empresa.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Senha@123', minLength: 6 })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: 'João Silva' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ enum: Role, default: Role.EMPLOYEE })
  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @ApiProperty({ example: 'uuid-da-empresa' })
  @IsUUID()
  companyId: string;
}
