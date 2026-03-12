import { IsEnum, IsOptional, IsNumber, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TimeRecordType } from '../../generated/prisma/enums';

export class CreateQrCodeSessionDto {
  @ApiProperty({
    enum: TimeRecordType,
    description: 'Tipo de registro permitido pelo QR code',
  })
  @IsEnum(TimeRecordType)
  allowedType: TimeRecordType;

  @ApiPropertyOptional({
    example: 10,
    description: 'Tempo de expiração em minutos',
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(60)
  expirationMinutes?: number;
}
