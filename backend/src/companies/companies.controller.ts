import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Role } from '../generated/prisma/enums';
import { CompaniesService } from './companies.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('companies')
@ApiBearerAuth('JWT-auth')
@Controller('companies')
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Public()
  @Post()
  @ApiOperation({ summary: 'Cadastrar nova empresa' })
  @ApiResponse({ status: 201, description: 'Empresa criada com sucesso' })
  async create(@Body() createCompanyDto: CreateCompanyDto) {
    return this.companiesService.create(createCompanyDto);
  }

  @Get()
  @Roles(Role.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Listar todas as empresas' })
  async findAll() {
    return this.companiesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar empresa por ID' })
  async findOne(@Param('id') id: string) {
    return this.companiesService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Atualizar empresa' })
  async update(
    @Param('id') id: string,
    @Body() updateCompanyDto: UpdateCompanyDto,
  ) {
    return this.companiesService.update(id, updateCompanyDto);
  }

  @Delete(':id')
  @Roles(Role.COMPANY_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Desativar empresa' })
  async remove(@Param('id') id: string) {
    return this.companiesService.remove(id);
  }
}
