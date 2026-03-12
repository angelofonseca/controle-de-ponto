import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
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
})
export class AppModule {}
