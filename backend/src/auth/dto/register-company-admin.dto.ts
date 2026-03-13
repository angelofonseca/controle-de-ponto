import {
    IsEmail,
    IsNotEmpty,
    IsOptional,
    IsString,
    MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterCompanyAdminDto {
    @ApiProperty({ example: 'Minha Empresa Ltda' })
    @IsString()
    @IsNotEmpty()
    companyName: string;

    @ApiPropertyOptional({ example: '00.000.000/0001-00' })
    @IsOptional()
    @IsString()
    companyCnpj?: string;

    @ApiProperty({ example: 'contato@empresa.com' })
    @IsEmail()
    companyEmail: string;

    @ApiPropertyOptional({ example: '(11) 9999-9999' })
    @IsOptional()
    @IsString()
    companyPhone?: string;

    @ApiPropertyOptional({ example: 'Rua Exemplo, 123 - Sao Paulo, SP' })
    @IsOptional()
    @IsString()
    companyAddress?: string;

    @ApiProperty({ example: 'Joao Silva' })
    @IsString()
    @IsNotEmpty()
    adminName: string;

    @ApiProperty({ example: 'admin@empresa.com' })
    @IsEmail()
    adminEmail: string;

    @ApiProperty({ example: 'Senha@123', minLength: 6 })
    @IsString()
    @MinLength(6)
    adminPassword: string;
}
