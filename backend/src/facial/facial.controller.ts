import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { FacialService } from './facial.service';
import { EnrollFaceDto } from './dto/enroll-face.dto';
import { ValidateFaceDto } from './dto/validate-face.dto';

@ApiTags('facial')
@ApiBearerAuth('JWT-auth')
@Controller('facial')
export class FacialController {
  constructor(private readonly facialService: FacialService) {}

  @Post('enroll')
  @ApiOperation({ summary: 'Cadastrar template facial do colaborador' })
  async enroll(@Body() dto: EnrollFaceDto, @CurrentUser() user: any) {
    return this.facialService.enrollTemplate(user, dto);
  }

  @Post('validate')
  @ApiOperation({ summary: 'Validar face sem registrar ponto (pré-checagem)' })
  async validate(@Body() dto: ValidateFaceDto, @CurrentUser() user: any) {
    return this.facialService.validateSample(user, {
      image: dto.image,
      userId: dto.userId,
      thresholdOverride: {
        accept: dto.accept,
        review: dto.review,
      },
    });
  }

  @Get('policy')
  @ApiOperation({ summary: 'Consultar thresholds de decisão facial' })
  getPolicy() {
    return this.facialService.getPolicy();
  }
}
