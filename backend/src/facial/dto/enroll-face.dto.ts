import {
  ArrayMinSize,
  IsArray,
  IsString,
  IsUUID,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class EnrollFaceDto {
  @ApiProperty({
    type: [String],
    description: 'Imagens em base64 (sem armazenar bruto no backend)',
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  images: string[];

  @ApiProperty({
    description: 'ID do colaborador para cadastrar template facial',
  })
  @IsUUID()
  userId: string;
}
