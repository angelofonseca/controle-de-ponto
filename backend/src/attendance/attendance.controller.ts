import { Controller, Get, Post, Query, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { AttendanceService } from './attendance.service';
import { FilterAttendanceDto } from './dto/filter-attendance.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('attendance')
@ApiBearerAuth('JWT-auth')
@Controller('attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Get('me')
  @ApiOperation({ summary: 'Buscar minha frequência' })
  async findMyAttendance(
    @CurrentUser() user: any,
    @Query() filter: FilterAttendanceDto,
  ) {
    return this.attendanceService.findMyAttendance(user, filter);
  }

  @Get('company')
  @Roles(Role.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Buscar frequência da empresa' })
  async findCompanyAttendance(
    @CurrentUser() user: any,
    @Query() filter: FilterAttendanceDto,
  ) {
    return this.attendanceService.findCompanyAttendance(user, filter);
  }

  @Get('dashboard')
  @Roles(Role.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Dashboard de frequência do dia' })
  async getDashboard(@CurrentUser() user: any) {
    return this.attendanceService.getDashboardSummary(user);
  }

  @Post('absent/:userId/:date')
  @Roles(Role.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Marcar falta para colaborador' })
  async markAbsent(
    @Param('userId') userId: string,
    @Param('date') date: string,
    @CurrentUser() user: any,
  ) {
    return this.attendanceService.markAbsent(userId, date, user);
  }
}
