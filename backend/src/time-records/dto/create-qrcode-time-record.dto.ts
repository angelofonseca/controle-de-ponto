import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateQrcodeTimeRecordDto {
  @ApiProperty({ example: 'token-do-qrcode' })
  @IsString()
  @IsNotEmpty()
  token: string;

  @ApiPropertyOptional({ example: 'Observação opcional' })
  @IsOptional()
  @IsString()
  notes?: string;
}
