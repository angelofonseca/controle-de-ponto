import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { FacialController } from './facial.controller';
import { FacialService } from './facial.service';
import { FACE_ENGINE } from './tokens';
import { InsightFaceEngine } from './engines/insight-face.engine';

@Module({
    imports: [ConfigModule],
    controllers: [FacialController],
    providers: [
        FacialService,
        InsightFaceEngine,
        {
            provide: FACE_ENGINE,
            useExisting: InsightFaceEngine,
        },
    ],
    exports: [FacialService],
})
export class FacialModule { }
