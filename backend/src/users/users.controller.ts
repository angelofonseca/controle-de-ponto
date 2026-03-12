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
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('users')
@ApiBearerAuth('JWT-auth')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @Public()
  @Post()
  @ApiOperation({ summary: 'Criar usuário administrador da empresa' })
  async create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get('me')
  @ApiOperation({ summary: 'Obter dados do usuário autenticado' })
  async findMe(@CurrentUser() user: any) {
    return this.usersService.findMe(user.sub);
  }

  @Get('company')
  @Roles(Role.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Listar usuários da empresa' })
  async findAllByCompany(@CurrentUser() user: any) {
    return this.usersService.findAllByCompany(user.companyId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar usuário por ID' })
  async findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.usersService.findOne(id, user);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar usuário' })
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @CurrentUser() user: any,
  ) {
    return this.usersService.update(id, updateUserDto, user);
  }

  @Delete(':id')
  @Roles(Role.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Desativar usuário' })
  async remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.usersService.remove(id, user);
  }
}
