import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { CompaniesModule } from './companies/companies.module';
import { UsersModule } from './users/users.module';
import { EmployeesModule } from './employees/employees.module';
import { WorkSchedulesModule } from './work-schedules/work-schedules.module';
import { TimeRecordsModule } from './time-records/time-records.module';
import { AttendanceModule } from './attendance/attendance.module';
import { QrcodeModule } from './qrcode/qrcode.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 120,
      },
    ]),
    PrismaModule,
    AuthModule,
    CompaniesModule,
    UsersModule,
    EmployeesModule,
    WorkSchedulesModule,
    TimeRecordsModule,
    AttendanceModule,
    QrcodeModule,
    HealthModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
