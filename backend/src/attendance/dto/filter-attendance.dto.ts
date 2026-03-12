import { IsOptional, IsDateString, IsUUID } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class FilterAttendanceDto {
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
}
