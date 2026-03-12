import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Role } from '../generated/prisma/enums';
import { WorkSchedulesService } from './work-schedules.service';
import { CreateWorkScheduleDto } from './dto/create-work-schedule.dto';
import { UpdateWorkScheduleDto } from './dto/update-work-schedule.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('work-schedules')
@ApiBearerAuth('JWT-auth')
@Controller('work-schedules')
export class WorkSchedulesController {
  constructor(private readonly workSchedulesService: WorkSchedulesService) {}

  @Post()
  @Roles(Role.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Criar jornada de trabalho' })
  async create(@Body() dto: CreateWorkScheduleDto, @CurrentUser() user: any) {
    return this.workSchedulesService.create(dto, user);
  }

  @Get()
  @ApiOperation({ summary: 'Listar jornadas de trabalho' })
  async findAll(@CurrentUser() user: any) {
    return this.workSchedulesService.findAll(user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar jornada por ID' })
  async findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.workSchedulesService.findOne(id, user);
  }

  @Patch(':id')
  @Roles(Role.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Atualizar jornada de trabalho' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateWorkScheduleDto,
    @CurrentUser() user: any,
  ) {
    return this.workSchedulesService.update(id, dto, user);
  }

  @Delete(':id')
  @Roles(Role.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Remover jornada de trabalho' })
  async remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.workSchedulesService.remove(id, user);
  }
}
