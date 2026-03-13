import {
  Controller,
  Get,
  Body,
  Patch,
  Delete,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Role } from '../generated/prisma/enums';
import { CompaniesService } from './companies.service';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('companies')
@ApiBearerAuth('JWT-auth')
@Controller('companies')
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) { }

  @Get('me')
  @Roles(Role.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Buscar empresa do usuário autenticado' })
  async findMyCompany(@CurrentUser() user: any) {
    return this.companiesService.findOne(user.companyId);
  }

  @Patch('me')
  @Roles(Role.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Atualizar empresa do usuário autenticado' })
  async update(@CurrentUser() user: any, @Body() updateCompanyDto: UpdateCompanyDto) {
    return this.companiesService.update(user.companyId, updateCompanyDto);
  }

  @Delete('me')
  @Roles(Role.COMPANY_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Desativar empresa do usuário autenticado' })
  async remove(@CurrentUser() user: any) {
    return this.companiesService.remove(user.companyId);
  }
}
