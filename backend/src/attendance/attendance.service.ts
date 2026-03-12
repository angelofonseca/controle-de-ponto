import { Injectable, ForbiddenException } from '@nestjs/common';
import { AttendanceStatus, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { FilterAttendanceDto } from './dto/filter-attendance.dto';

@Injectable()
export class AttendanceService {
  constructor(private readonly prisma: PrismaService) {}

  async findMyAttendance(requestingUser: any, filter: FilterAttendanceDto) {
    return this.findAttendance({ userId: requestingUser.sub }, filter);
  }

  async findCompanyAttendance(
    requestingUser: any,
    filter: FilterAttendanceDto,
  ) {
    const where: any = {
      user: { companyId: requestingUser.companyId },
    };

    if (filter.userId) {
      where.userId = filter.userId;
    }

    return this.findAttendance(where, filter);
  }

  async markAbsent(userId: string, date: string, requestingUser: any) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user || user.companyId !== requestingUser.companyId) {
      throw new ForbiddenException('Acesso negado');
    }

    const attendanceDate = new Date(date);
    attendanceDate.setHours(0, 0, 0, 0);

    return this.prisma.attendanceDay.upsert({
      where: { userId_date: { userId, date: attendanceDate } },
      create: {
        userId,
        date: attendanceDate,
        status: AttendanceStatus.ABSENT,
        totalMinutes: 0,
        lateMinutes: 0,
      },
      update: {
        status: AttendanceStatus.ABSENT,
      },
    });
  }

  async getDashboardSummary(requestingUser: any) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [totalEmployees, presentToday, lateToday, absentToday] =
      await Promise.all([
        this.prisma.user.count({
          where: {
            companyId: requestingUser.companyId,
            role: Role.EMPLOYEE,
            active: true,
          },
        }),
        this.prisma.attendanceDay.count({
          where: {
            user: { companyId: requestingUser.companyId },
            date: { gte: today, lt: tomorrow },
            status: {
              in: [
                AttendanceStatus.ON_TIME,
                AttendanceStatus.COMPLETED,
                AttendanceStatus.IN_PROGRESS,
              ],
            },
          },
        }),
        this.prisma.attendanceDay.count({
          where: {
            user: { companyId: requestingUser.companyId },
            date: { gte: today, lt: tomorrow },
            status: AttendanceStatus.LATE,
          },
        }),
        this.prisma.attendanceDay.count({
          where: {
            user: { companyId: requestingUser.companyId },
            date: { gte: today, lt: tomorrow },
            status: AttendanceStatus.ABSENT,
          },
        }),
      ]);

    return {
      date: today.toISOString().split('T')[0],
      totalEmployees,
      presentToday,
      lateToday,
      absentToday,
      notRecordedToday: totalEmployees - presentToday - lateToday - absentToday,
    };
  }

  private async findAttendance(where: any, filter: FilterAttendanceDto) {
    if (filter.startDate || filter.endDate) {
      where.date = {};
      if (filter.startDate) {
        where.date.gte = new Date(filter.startDate);
      }
      if (filter.endDate) {
        where.date.lte = new Date(filter.endDate);
      }
    }

    return this.prisma.attendanceDay.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { date: 'desc' },
    });
  }
}
