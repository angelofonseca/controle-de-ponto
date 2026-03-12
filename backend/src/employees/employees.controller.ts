import { Controller, Get, Post, Body, Patch, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Role } from '../generated/prisma/enums';
import { EmployeesService } from './employees.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('employees')
@ApiBearerAuth('JWT-auth')
@Controller('employees')
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  @Post()
  @Roles(Role.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Criar perfil de colaborador' })
  async create(
    @Body() createEmployeeDto: CreateEmployeeDto,
    @CurrentUser() user: any,
  ) {
    return this.employeesService.create(createEmployeeDto, user);
  }

  @Get()
  @Roles(Role.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Listar colaboradores da empresa' })
  async findAll(@CurrentUser() user: any) {
    return this.employeesService.findAll(user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar colaborador por ID' })
  async findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.employeesService.findOne(id, user);
  }

  @Patch(':id')
  @Roles(Role.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Atualizar colaborador' })
  async update(
    @Param('id') id: string,
    @Body() updateEmployeeDto: UpdateEmployeeDto,
    @CurrentUser() user: any,
  ) {
    return this.employeesService.update(id, updateEmployeeDto, user);
  }
}
