import {
  IsString,
  IsOptional,
  IsUUID,
  IsDateString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateEmployeeDto {
  @ApiProperty({ example: 'uuid-do-usuario' })
  @IsUUID()
  userId: string;

  @ApiPropertyOptional({ example: 'EMP001' })
  @IsOptional()
  @IsString()
  registration?: string;

  @ApiPropertyOptional({ example: 'Desenvolvedor' })
  @IsOptional()
  @IsString()
  position?: string;

  @ApiPropertyOptional({ example: 'Tecnologia' })
  @IsOptional()
  @IsString()
  department?: string;

  @ApiPropertyOptional({ example: '2024-01-01' })
  @IsOptional()
  @IsDateString()
  hireDate?: string;

  @ApiPropertyOptional({ example: 'uuid-da-jornada' })
  @IsOptional()
  @IsUUID()
  workScheduleId?: string;
}
