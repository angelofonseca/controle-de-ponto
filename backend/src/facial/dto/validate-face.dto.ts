import {
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ValidateFaceDto {
  @ApiProperty({
    description: 'Imagem base64 capturada no momento da validação',
  })
  @IsString()
  image: string;

  @ApiPropertyOptional({
    description: 'Permite que admin valide para outro colaborador',
  })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiPropertyOptional({
    description: 'Threshold de aprovação (sobrescreve valor global)',
    example: 0.55,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  accept?: number;

  @ApiPropertyOptional({
    description: 'Threshold de revisão (sobrescreve valor global)',
    example: 0.45,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  review?: number;
}
