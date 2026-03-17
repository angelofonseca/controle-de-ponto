import {
  ArrayMinSize,
  IsArray,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class EnrollFaceDto {
  @ApiProperty({
    type: [String],
    description: 'Imagens em base64 (sem armazenar bruto no backend)',
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  images: string[];

  @ApiPropertyOptional({
    description: 'Permite que admin cadastre face para outro colaborador',
  })
  @IsOptional()
  @IsUUID()
  userId?: string;
}
