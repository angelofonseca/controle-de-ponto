import {
  IsString,
  IsNotEmpty,
  IsArray,
  IsNumber,
  IsOptional,
  Min,
  Max,
  ArrayMinSize,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateWorkScheduleDto {
  @ApiProperty({ example: 'Horário Padrão' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: '08:00', description: 'Hora de entrada (HH:mm)' })
  @IsString()
  @IsNotEmpty()
  startTime: string;

  @ApiProperty({ example: '17:00', description: 'Hora de saída (HH:mm)' })
  @IsString()
  @IsNotEmpty()
  endTime: string;

  @ApiPropertyOptional({
    example: 60,
    description: 'Duração do intervalo em minutos',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  breakDuration?: number;

  @ApiProperty({
    example: [1, 2, 3, 4, 5],
    description: 'Dias da semana (0=Dom, 1=Seg, ..., 6=Sáb)',
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsNumber({}, { each: true })
  @Min(0, { each: true })
  @Max(6, { each: true })
  workingDays: number[];

  @ApiPropertyOptional({
    example: 10,
    description: 'Tolerância de atraso em minutos',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  toleranceMinutes?: number;
}
