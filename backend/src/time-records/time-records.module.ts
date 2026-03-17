import { Module } from '@nestjs/common';
import { FacialModule } from '../facial/facial.module';
import { TimeRecordsService } from './time-records.service';
import { TimeRecordsController } from './time-records.controller';

@Module({
  imports: [FacialModule],
  controllers: [TimeRecordsController],
  providers: [TimeRecordsService],
  exports: [TimeRecordsService],
})
export class TimeRecordsModule { }
