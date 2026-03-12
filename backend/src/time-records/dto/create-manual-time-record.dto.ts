import { IsEnum, IsOptional, IsString, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TimeRecordType } from '../../generated/prisma/enums';

export class CreateManualTimeRecordDto {
  @ApiProperty({ enum: TimeRecordType })
  @IsEnum(TimeRecordType)
  type: TimeRecordType;

  @ApiPropertyOptional({ example: '2024-01-15T08:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  recordedAt?: string;

  @ApiPropertyOptional({ example: 'Observação opcional' })
  @IsOptional()
  @IsString()
  notes?: string;
}
