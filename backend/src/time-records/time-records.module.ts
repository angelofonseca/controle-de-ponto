import { Module } from '@nestjs/common';
import { TimeRecordsService } from './time-records.service';
import { TimeRecordsController } from './time-records.controller';

@Module({
  controllers: [TimeRecordsController],
  providers: [TimeRecordsService],
  exports: [TimeRecordsService],
})
export class TimeRecordsModule {}
