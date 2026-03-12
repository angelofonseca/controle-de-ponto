import { IsOptional, IsDateString, IsUUID, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { TimeRecordType, RecordMethod } from '@prisma/client';

export class FilterTimeRecordsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiPropertyOptional({ enum: TimeRecordType })
  @IsOptional()
  @IsEnum(TimeRecordType)
  type?: TimeRecordType;

  @ApiPropertyOptional({ enum: RecordMethod })
  @IsOptional()
  @IsEnum(RecordMethod)
  method?: RecordMethod;
}
