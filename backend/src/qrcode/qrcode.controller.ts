import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { QrcodeService } from './qrcode.service';
import { CreateQrCodeSessionDto } from './dto/create-qr-code-session.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('qrcode')
@ApiBearerAuth('JWT-auth')
@Controller('qrcode')
export class QrcodeController {
  constructor(private readonly qrcodeService: QrcodeService) {}

  @Post('session')
  @Roles(Role.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Criar sessão de QR code' })
  async createSession(
    @Body() dto: CreateQrCodeSessionDto,
    @CurrentUser() user: any,
  ) {
    return this.qrcodeService.createSession(dto, user);
  }

  @Get('session/current')
  @Roles(Role.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Obter sessão QR code ativa' })
  async getCurrentSession(@CurrentUser() user: any) {
    return this.qrcodeService.getCurrentSession(user);
  }

  @Get('session/history')
  @Roles(Role.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Histórico de sessões QR code' })
  async getSessionHistory(@CurrentUser() user: any) {
    return this.qrcodeService.getSessionHistory(user);
  }

  @Public()
  @Get('validate/:token')
  @ApiOperation({ summary: 'Validar token de QR code (público)' })
  async validateToken(@Param('token') token: string) {
    return this.qrcodeService.validateToken(token);
  }
}
