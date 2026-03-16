import {
    BadRequestException,
    ForbiddenException,
    Injectable,
    NotFoundException,
    Inject,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { FaceMatchDecision } from '../generated/prisma/enums';
import { FACE_ENGINE } from './tokens';
import { FaceEngine } from './engines/face-engine.interface';
import { FaceThresholdPolicy, resolveDecision } from './facial.policy';

interface ActorContext {
    sub: string;
    companyId: string;
    role?: string;
}

export interface EnrollFaceDto {
    images: string[];
    userId?: string;
    minConfidence?: number;
}

export interface ValidateFaceDto {
    image: string;
    userId?: string;
    thresholdOverride?: Partial<FaceThresholdPolicy>;
}

export interface ValidationResult {
    decision: FaceMatchDecision;
    score: number;
    threshold: FaceThresholdPolicy;
    eventId: string;
    templateId: string;
    livenessPassed?: boolean;
}

@Injectable()
export class FacialService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly configService: ConfigService,
        @Inject(FACE_ENGINE) private readonly faceEngine: FaceEngine,
    ) { }

    async enrollTemplate(actor: ActorContext, dto: EnrollFaceDto) {
        const targetUserId = dto.userId ?? actor.sub;

        if (actor.role !== 'COMPANY_ADMIN' && targetUserId !== actor.sub) {
            throw new ForbiddenException(
                'Apenas admins podem cadastrar face de terceiros',
            );
        }

        if (!dto.images || dto.images.length === 0) {
            throw new BadRequestException(
                'Envie pelo menos uma imagem para cadastro',
            );
        }

        const minConfidence = dto.minConfidence ?? 0.6;
        const embeddings: number[][] = [];
        let qualitySum = 0;

        for (const image of dto.images) {
            const result = await this.faceEngine.detectAndEmbed(image);
            if (result.detection.confidence < minConfidence) {
                continue;
            }
            embeddings.push(result.embedding);
            if (result.quality) {
                qualitySum += result.quality;
            }
        }

        if (embeddings.length === 0) {
            throw new BadRequestException(
                'Nenhuma face com confiança suficiente encontrada',
            );
        }

        const averageEmbedding = this.averageEmbedding(embeddings);
        const qualityScore = qualitySum > 0 ? qualitySum / embeddings.length : null;

        await this.prisma.faceTemplate.updateMany({
            where: { userId: targetUserId, active: true },
            data: { active: false },
        });

        const template = await this.prisma.faceTemplate.create({
            data: {
                userId: targetUserId,
                companyId: actor.companyId,
                embedding: averageEmbedding,
                samplesCount: embeddings.length,
                qualityScore,
                livenessPassed: null,
            },
        });

        return {
            templateId: template.id,
            samplesUsed: embeddings.length,
            qualityScore,
            engine: template.engine,
            version: template.version,
        };
    }

    async validateSample(
        actor: ActorContext,
        dto: ValidateFaceDto,
    ): Promise<ValidationResult> {
        const targetUserId = dto.userId ?? actor.sub;

        if (actor.role !== 'COMPANY_ADMIN' && targetUserId !== actor.sub) {
            throw new ForbiddenException(
                'Apenas admins podem validar ponto de terceiros',
            );
        }

        const template = await this.prisma.faceTemplate.findFirst({
            where: { userId: targetUserId, companyId: actor.companyId, active: true },
        });

        if (!template) {
            throw new NotFoundException(
                'Nenhum template facial ativo para o usuário',
            );
        }

        const result = await this.faceEngine.detectAndEmbed(dto.image);

        const score = this.cosineSimilarity(template.embedding, result.embedding);
        const threshold = this.resolvePolicy(dto.thresholdOverride);
        const decision = resolveDecision(score, threshold);

        const event = await this.prisma.faceValidationEvent.create({
            data: {
                userId: targetUserId,
                companyId: actor.companyId,
                templateId: template.id,
                score,
                threshold: threshold.accept,
                decision,
                metadata: {
                    detectionConfidence: result.detection.confidence ?? null,
                    quality: result.quality ?? null,
                    liveness: result.liveness
                        ? {
                            passed: result.liveness.passed,
                            score: result.liveness.score ?? null,
                        }
                        : null,
                    thresholdReview: threshold.review,
                },
            },
        });

        return {
            decision,
            score,
            threshold,
            eventId: event.id,
            templateId: template.id,
            livenessPassed: result.liveness?.passed,
        };
    }

    async attachEventToTimeRecord(eventId: string, timeRecordId: string) {
        await this.prisma.faceValidationEvent.update({
            where: { id: eventId },
            data: { timeRecordId },
        });
    }

    getPolicy(): FaceThresholdPolicy {
        return this.resolvePolicy();
    }

    private resolvePolicy(
        override?: Partial<FaceThresholdPolicy>,
    ): FaceThresholdPolicy {
        const accept = Number(
            override?.accept ??
            this.configService.get<string>('FACE_THRESHOLD_ACCEPT') ??
            0.55,
        );
        const review = Number(
            override?.review ??
            this.configService.get<string>('FACE_THRESHOLD_REVIEW') ??
            0.45,
        );

        if (review >= accept) {
            throw new BadRequestException('review deve ser menor que accept');
        }

        return { accept, review };
    }

    private cosineSimilarity(a: number[], b: number[]): number {
        if (a.length !== b.length) {
            throw new BadRequestException('Embeddings com tamanhos diferentes');
        }

        let dot = 0;
        let normA = 0;
        let normB = 0;

        for (let i = 0; i < a.length; i += 1) {
            dot += a[i] * b[i];
            normA += a[i] * a[i];
            normB += b[i] * b[i];
        }

        if (normA === 0 || normB === 0) {
            throw new BadRequestException('Embedding inválido');
        }

        return dot / (Math.sqrt(normA) * Math.sqrt(normB));
    }

    private averageEmbedding(embeddings: number[][]): number[] {
        const length = embeddings[0].length;
        const accumulator = new Array<number>(length).fill(0);

        embeddings.forEach((embedding) => {
            if (embedding.length !== length) {
                throw new BadRequestException('Embeddings com tamanhos diferentes');
            }
            for (let i = 0; i < length; i += 1) {
                accumulator[i] += embedding[i];
            }
        });

        return accumulator.map((value) => value / embeddings.length);
    }
}
