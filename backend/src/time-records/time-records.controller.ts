import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Role } from '../generated/prisma/enums';
import { TimeRecordsService } from './time-records.service';
import { CreateManualTimeRecordDto } from './dto/create-manual-time-record.dto';
import { CreateQrcodeTimeRecordDto } from './dto/create-qrcode-time-record.dto';
import { FilterTimeRecordsDto } from './dto/filter-time-records.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('time-records')
@ApiBearerAuth('JWT-auth')
@Controller('time-records')
export class TimeRecordsController {
  constructor(private readonly timeRecordsService: TimeRecordsService) {}

  @Post('manual')
  @ApiOperation({ summary: 'Registrar ponto manualmente' })
  async createManual(
    @Body() dto: CreateManualTimeRecordDto,
    @CurrentUser() user: any,
  ) {
    return this.timeRecordsService.createManual(dto, user);
  }

  @Post('qrcode')
  @ApiOperation({ summary: 'Registrar ponto via QR code' })
  async createViaQrcode(
    @Body() dto: CreateQrcodeTimeRecordDto,
    @CurrentUser() user: any,
  ) {
    return this.timeRecordsService.createViaQrcode(dto, user);
  }

  @Get('me')
  @ApiOperation({ summary: 'Buscar meus registros de ponto' })
  async findMyRecords(
    @CurrentUser() user: any,
    @Query() filter: FilterTimeRecordsDto,
  ) {
    return this.timeRecordsService.findMyRecords(user, filter);
  }

  @Get('company')
  @Roles(Role.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Buscar registros de ponto da empresa' })
  async findCompanyRecords(
    @CurrentUser() user: any,
    @Query() filter: FilterTimeRecordsDto,
  ) {
    return this.timeRecordsService.findCompanyRecords(user, filter);
  }
}
