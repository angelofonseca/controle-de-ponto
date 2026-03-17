import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { Role } from '../generated/prisma/enums';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';

@Injectable()
export class EmployeesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createEmployeeDto: CreateEmployeeDto, requestingUser: any) {
    const user = await this.prisma.user.findUnique({
      where: { id: createEmployeeDto.userId },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    if (user.companyId !== requestingUser.companyId) {
      throw new ForbiddenException('Acesso negado');
    }

    const existing = await this.prisma.employeeProfile.findUnique({
      where: { userId: createEmployeeDto.userId },
    });

    if (existing) {
      throw new ConflictException('Perfil de colaborador já existe');
    }

    // Validate workScheduleId belongs to the same company
    if (createEmployeeDto.workScheduleId) {
      const schedule = await this.prisma.workSchedule.findUnique({
        where: { id: createEmployeeDto.workScheduleId },
      });

      if (!schedule || schedule.companyId !== requestingUser.companyId) {
        throw new ForbiddenException(
          'Jornada de trabalho não pertence a esta empresa',
        );
      }
    }

    return this.prisma.employeeProfile.create({
      data: {
        userId: createEmployeeDto.userId,
        registration: createEmployeeDto.registration,
        position: createEmployeeDto.position,
        department: createEmployeeDto.department,
        hireDate: createEmployeeDto.hireDate
          ? new Date(createEmployeeDto.hireDate)
          : null,
        workScheduleId: createEmployeeDto.workScheduleId,
      },
      include: { user: { select: { id: true, name: true, email: true } } },
    });
  }

  async findAll(requestingUser: any) {
    return this.prisma.employeeProfile.findMany({
      where: { user: { companyId: requestingUser.companyId } },
      include: {
        user: { select: { id: true, name: true, email: true, active: true } },
        workSchedule: { select: { id: true, name: true } },
      },
      orderBy: { user: { name: 'asc' } },
    });
  }

  async findOne(id: string, requestingUser: any) {
    const profile = await this.prisma.employeeProfile.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            companyId: true,
          },
        },
        workSchedule: true,
      },
    });

    if (!profile) {
      throw new NotFoundException('Colaborador não encontrado');
    }

    if (profile.user.companyId !== requestingUser.companyId) {
      throw new ForbiddenException('Acesso negado');
    }

    if (
      requestingUser.role === Role.EMPLOYEE &&
      profile.userId !== requestingUser.sub
    ) {
      throw new ForbiddenException('Acesso negado');
    }

    return profile;
  }

  async update(
    id: string,
    updateEmployeeDto: UpdateEmployeeDto,
    requestingUser: any,
  ) {
    await this.findOne(id, requestingUser);

    // Validate workScheduleId belongs to the same company
    if (updateEmployeeDto.workScheduleId) {
      const schedule = await this.prisma.workSchedule.findUnique({
        where: { id: updateEmployeeDto.workScheduleId },
      });

      if (!schedule || schedule.companyId !== requestingUser.companyId) {
        throw new ForbiddenException(
          'Jornada de trabalho não pertence a esta empresa',
        );
      }
    }

    const data: any = { ...updateEmployeeDto };
    if (updateEmployeeDto.hireDate) {
      data.hireDate = new Date(updateEmployeeDto.hireDate);
    }
    delete data.userId;

    return this.prisma.employeeProfile.update({
      where: { id },
      data,
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });
  }
}
