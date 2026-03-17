import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TimeRecordType } from '../../generated/prisma/enums';

export class CreateFacialTimeRecordDto {
  @ApiProperty({ enum: TimeRecordType })
  @IsEnum(TimeRecordType)
  type: TimeRecordType;

  @ApiProperty({ description: 'Imagem base64 capturada no momento do ponto' })
  @IsString()
  image: string;

  @ApiPropertyOptional({ description: 'Observações adicionais' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({
    description: 'Threshold opcional para aprovação',
    example: 0.55,
  })
  @IsOptional()
  thresholdAccept?: number;

  @ApiPropertyOptional({
    description: 'Threshold opcional para revisão',
    example: 0.45,
  })
  @IsOptional()
  thresholdReview?: number;
}
