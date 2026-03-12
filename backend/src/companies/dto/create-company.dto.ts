import {
  IsString,
  IsEmail,
  IsOptional,
  MinLength,
  IsNotEmpty,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCompanyDto {
  @ApiProperty({ example: 'Minha Empresa Ltda' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  name: string;

  @ApiPropertyOptional({ example: '00.000.000/0001-00' })
  @IsOptional()
  @IsString()
  cnpj?: string;

  @ApiProperty({ example: 'contato@empresa.com' })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ example: '(11) 9999-9999' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'Rua Exemplo, 123 - São Paulo, SP' })
  @IsOptional()
  @IsString()
  address?: string;
}
