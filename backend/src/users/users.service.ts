import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { Role } from '../generated/prisma/enums';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) { }

  async create(createUserDto: CreateUserDto, requestingUser: any) {
    const existing = await this.prisma.user.findUnique({
      where: { email: createUserDto.email },
    });

    if (existing) {
      throw new ConflictException('E-mail já cadastrado');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    const requestedRole = createUserDto.role ?? Role.EMPLOYEE;
    const role = requestedRole === Role.COMPANY_ADMIN ? Role.EMPLOYEE : requestedRole;

    const user = await this.prisma.user.create({
      data: {
        email: createUserDto.email,
        name: createUserDto.name,
        password: hashedPassword,
        role,
        companyId: requestingUser.companyId,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        active: true,
        companyId: true,
        createdAt: true,
      },
    });

    return user;
  }

  async findMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        active: true,
        companyId: true,
        createdAt: true,
        company: { select: { id: true, name: true } },
        employeeProfile: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    return user;
  }

  async findAllByCompany(companyId: string) {
    return this.prisma.user.findMany({
      where: { companyId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        active: true,
        createdAt: true,
        employeeProfile: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string, requestingUser: any) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        active: true,
        companyId: true,
        createdAt: true,
        company: { select: { id: true, name: true } },
        employeeProfile: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    // Employee can only see their own data
    if (
      requestingUser.role === Role.EMPLOYEE &&
      user.id !== requestingUser.sub
    ) {
      throw new ForbiddenException('Acesso negado');
    }

    // Admin can only see users from their company
    if (user.companyId !== requestingUser.companyId) {
      throw new ForbiddenException('Acesso negado');
    }

    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto, requestingUser: any) {
    await this.findOne(id, requestingUser);

    const data: any = { ...updateUserDto };

    if (updateUserDto.password) {
      data.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    return this.prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        active: true,
        companyId: true,
        updatedAt: true,
      },
    });
  }

  async remove(id: string, requestingUser: any) {
    await this.findOne(id, requestingUser);

    return this.prisma.user.update({
      where: { id },
      data: { active: false },
      select: { id: true, active: true },
    });
  }
}
