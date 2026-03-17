import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import {
  TimeRecordType,
  RecordMethod,
  FaceMatchDecision,
} from '../generated/prisma/enums';
import { PrismaService } from '../prisma/prisma.service';
import { CreateManualTimeRecordDto } from './dto/create-manual-time-record.dto';
import { CreateQrcodeTimeRecordDto } from './dto/create-qrcode-time-record.dto';
import { CreateFacialTimeRecordDto } from './dto/create-facial-time-record.dto';
import { FilterTimeRecordsDto } from './dto/filter-time-records.dto';
import { FacialService } from '../facial/facial.service';

const VALID_SEQUENCE: TimeRecordType[] = [
  TimeRecordType.CLOCK_IN,
  TimeRecordType.BREAK_START,
  TimeRecordType.BREAK_END,
  TimeRecordType.CLOCK_OUT,
];

@Injectable()
export class TimeRecordsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly facialService: FacialService,
  ) { }

  async createManual(dto: CreateManualTimeRecordDto, requestingUser: any) {
    await this.validateSequence(requestingUser.sub, dto.type);

    const record = await this.prisma.timeRecord.create({
      data: {
        type: dto.type,
        method: RecordMethod.MANUAL,
        recordedAt: dto.recordedAt ? new Date(dto.recordedAt) : new Date(),
        notes: dto.notes,
        userId: requestingUser.sub,
      },
      include: {
        user: { select: { id: true, name: true } },
      },
    });

    await this.updateAttendanceDay(requestingUser.sub, record.recordedAt);

    return record;
  }

  async createViaQrcode(dto: CreateQrcodeTimeRecordDto, requestingUser: any) {
    const session = await this.prisma.qrCodeSession.findUnique({
      where: { token: dto.token },
    });

    if (!session) {
      throw new NotFoundException('QR code não encontrado');
    }

    if (session.expiresAt < new Date()) {
      throw new BadRequestException('QR code expirado');
    }

    if (session.companyId !== requestingUser.companyId) {
      throw new ForbiddenException('QR code inválido para esta empresa');
    }

    await this.validateSequence(requestingUser.sub, session.allowedType);

    const now = new Date();

    const record = await this.prisma.timeRecord.create({
      data: {
        type: session.allowedType,
        method: RecordMethod.QR_CODE,
        recordedAt: now,
        notes: dto.notes,
        userId: requestingUser.sub,
        qrCodeSessionId: session.id,
      },
      include: { user: { select: { id: true, name: true } } },
    });

    // Mark QR code session as used
    await this.prisma.qrCodeSession.update({
      where: { id: session.id },
      data: { used: true, usedAt: now },
    });

    await this.updateAttendanceDay(requestingUser.sub, now);

    return record;
  }

  async createViaFacial(dto: CreateFacialTimeRecordDto, requestingUser: any) {
    const validation = await this.facialService.validateSample(
      {
        sub: requestingUser.sub,
        companyId: requestingUser.companyId,
        role: requestingUser.role,
      },
      {
        image: dto.image,
        thresholdOverride: {
          accept: dto.thresholdAccept,
          review: dto.thresholdReview,
        },
      },
    );

    if (validation.decision === FaceMatchDecision.REJECTED) {
      throw new ForbiddenException('Validação facial rejeitada');
    }

    if (validation.decision === FaceMatchDecision.REVIEW) {
      return {
        decision: validation.decision,
        score: validation.score,
        threshold: validation.threshold,
        message: 'Validação facial requer revisão manual',
      };
    }

    await this.validateSequence(requestingUser.sub, dto.type);

    const now = new Date();

    const record = await this.prisma.timeRecord.create({
      data: {
        type: dto.type,
        method: RecordMethod.FACIAL,
        recordedAt: now,
        notes: dto.notes,
        userId: requestingUser.sub,
      },
      include: { user: { select: { id: true, name: true } } },
    });

    await this.facialService.attachEventToTimeRecord(validation.eventId, record.id);
    await this.updateAttendanceDay(requestingUser.sub, now);

    return {
      record,
      facialDecision: validation.decision,
      score: validation.score,
      threshold: validation.threshold,
    };
  }

  async findMyRecords(requestingUser: any, filter: FilterTimeRecordsDto) {
    return this.findRecords({ ...filter, userId: requestingUser.sub });
  }

  async findCompanyRecords(requestingUser: any, filter: FilterTimeRecordsDto) {
    const where: any = {
      user: { companyId: requestingUser.companyId },
    };

    if (filter.userId) {
      where.userId = filter.userId;
    }

    return this.buildFilteredQuery(where, filter);
  }

  private async findRecords(filter: FilterTimeRecordsDto) {
    const where: any = {};

    if (filter.userId) {
      where.userId = filter.userId;
    }

    return this.buildFilteredQuery(where, filter);
  }

  private async buildFilteredQuery(where: any, filter: FilterTimeRecordsDto) {
    if (filter.startDate || filter.endDate) {
      where.recordedAt = {};
      if (filter.startDate) {
        where.recordedAt.gte = new Date(filter.startDate);
      }
      if (filter.endDate) {
        const endDate = new Date(filter.endDate);
        endDate.setHours(23, 59, 59, 999);
        where.recordedAt.lte = endDate;
      }
    }

    if (filter.type) {
      where.type = filter.type;
    }

    if (filter.method) {
      where.method = filter.method;
    }

    return this.prisma.timeRecord.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { recordedAt: 'desc' },
    });
  }

  private async validateSequence(userId: string, newType: TimeRecordType) {
    const now = new Date();
    const today = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
    );
    const tomorrow = new Date(today);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

    const todayRecords = await this.prisma.timeRecord.findMany({
      where: {
        userId,
        recordedAt: { gte: today, lt: tomorrow },
      },
      orderBy: { recordedAt: 'asc' },
    });

    if (todayRecords.length === 0) {
      if (newType !== TimeRecordType.CLOCK_IN) {
        throw new BadRequestException(
          'O primeiro registro do dia deve ser CLOCK_IN (entrada)',
        );
      }
      return;
    }

    const lastRecord = todayRecords[todayRecords.length - 1];
    const lastIndex = VALID_SEQUENCE.indexOf(lastRecord.type);
    const newIndex = VALID_SEQUENCE.indexOf(newType);

    if (newIndex !== lastIndex + 1) {
      const nextExpected = VALID_SEQUENCE[lastIndex + 1];
      throw new BadRequestException(
        `Sequência inválida. Após ${lastRecord.type}, o próximo registro deve ser ${nextExpected || 'nenhum (expediente encerrado)'}`,
      );
    }
  }

  private async updateAttendanceDay(userId: string, recordedAt: Date) {
    const date = new Date(
      Date.UTC(
        recordedAt.getUTCFullYear(),
        recordedAt.getUTCMonth(),
        recordedAt.getUTCDate(),
      ),
    );

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        employeeProfile: { include: { workSchedule: true } },
      },
    });

    const todayRecords = await this.prisma.timeRecord.findMany({
      where: {
        userId,
        recordedAt: {
          gte: date,
          lt: new Date(date.getTime() + 86400000),
        },
      },
      orderBy: { recordedAt: 'asc' },
    });

    let status: any = 'IN_PROGRESS';
    let totalMinutes: number | null = null;
    let lateMinutes = 0;

    const clockIn = todayRecords.find(
      (r) => r.type === TimeRecordType.CLOCK_IN,
    );
    const clockOut = todayRecords.find(
      (r) => r.type === TimeRecordType.CLOCK_OUT,
    );

    // Check lateness first (applies whether day is completed or not)
    const workSchedule = user?.employeeProfile?.workSchedule;
    if (clockIn && workSchedule) {
      const [startHour, startMin] = workSchedule.startTime
        .split(':')
        .map(Number);
      const expectedStart = new Date(date);
      expectedStart.setUTCHours(startHour, startMin, 0, 0);
      const actualStart = new Date(clockIn.recordedAt);
      const diffMinutes = Math.floor(
        (actualStart.getTime() - expectedStart.getTime()) / 60000,
      );

      if (diffMinutes > (workSchedule.toleranceMinutes || 10)) {
        lateMinutes = diffMinutes;
      }
    }

    if (clockIn && clockOut) {
      // Preserve LATE info when completing the day
      status = lateMinutes > 0 ? 'LATE' : 'COMPLETED';
      const clockInTime = new Date(clockIn.recordedAt);
      const clockOutTime = new Date(clockOut.recordedAt);
      const breakStart = todayRecords.find(
        (r) => r.type === TimeRecordType.BREAK_START,
      );
      const breakEnd = todayRecords.find(
        (r) => r.type === TimeRecordType.BREAK_END,
      );

      let breakMinutes = 0;
      if (breakStart && breakEnd) {
        breakMinutes = Math.floor(
          (new Date(breakEnd.recordedAt).getTime() -
            new Date(breakStart.recordedAt).getTime()) /
            60000,
        );
      }

      totalMinutes =
        Math.floor((clockOutTime.getTime() - clockInTime.getTime()) / 60000) -
        breakMinutes;
    } else if (clockIn) {
      status = lateMinutes > 0 ? 'LATE' : 'IN_PROGRESS';
    }

    await this.prisma.attendanceDay.upsert({
      where: { userId_date: { userId, date } },
      create: {
        userId,
        date,
        status,
        totalMinutes,
        lateMinutes,
        expectedMinutes: user?.employeeProfile?.workSchedule
          ? this.calculateExpectedMinutes(user.employeeProfile.workSchedule)
          : null,
      },
      update: {
        status,
        totalMinutes,
        lateMinutes,
      },
    });
  }

  private calculateExpectedMinutes(schedule: any): number {
    const [startHour, startMin] = schedule.startTime.split(':').map(Number);
    const [endHour, endMin] = schedule.endTime.split(':').map(Number);
    const totalMinutes = endHour * 60 + endMin - (startHour * 60 + startMin);
    return totalMinutes - (schedule.breakDuration || 60);
  }
}
