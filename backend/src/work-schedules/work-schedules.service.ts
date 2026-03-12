import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWorkScheduleDto } from './dto/create-work-schedule.dto';
import { UpdateWorkScheduleDto } from './dto/update-work-schedule.dto';

@Injectable()
export class WorkSchedulesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createDto: CreateWorkScheduleDto, requestingUser: any) {
    return this.prisma.workSchedule.create({
      data: {
        ...createDto,
        companyId: requestingUser.companyId,
      },
    });
  }

  async findAll(requestingUser: any) {
    return this.prisma.workSchedule.findMany({
      where: { companyId: requestingUser.companyId },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string, requestingUser: any) {
    const schedule = await this.prisma.workSchedule.findUnique({
      where: { id },
      include: { _count: { select: { employees: true } } },
    });

    if (!schedule) {
      throw new NotFoundException('Jornada não encontrada');
    }

    if (schedule.companyId !== requestingUser.companyId) {
      throw new ForbiddenException('Acesso negado');
    }

    return schedule;
  }

  async update(
    id: string,
    updateDto: UpdateWorkScheduleDto,
    requestingUser: any,
  ) {
    await this.findOne(id, requestingUser);

    return this.prisma.workSchedule.update({
      where: { id },
      data: updateDto,
    });
  }

  async remove(id: string, requestingUser: any) {
    await this.findOne(id, requestingUser);

    return this.prisma.workSchedule.delete({ where: { id } });
  }
}
