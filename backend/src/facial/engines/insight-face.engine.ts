import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FaceEngine, EmbeddingResult } from './face-engine.interface';

interface InsightFaceResponse {
  embedding: number[];
  detection?: {
    score?: number;
    bbox?: [number, number, number, number];
    landmarks?: number[][];
  };
  quality?: number;
  liveness?: {
    passed: boolean;
    score?: number;
  };
}

@Injectable()
export class InsightFaceEngine implements FaceEngine {
  private readonly logger = new Logger(InsightFaceEngine.name);

  constructor(private readonly configService: ConfigService) {}

  async detectAndEmbed(imageBase64: string): Promise<EmbeddingResult> {
    const baseUrl = this.configService.get<string>('FACE_ENGINE_URL');

    if (!baseUrl) {
      throw new Error(
        'FACE_ENGINE_URL não configurada. Configure para apontar para o serviço InsightFace.',
      );
    }

    const response = await fetch(`${baseUrl}/api/v1/face/embed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBase64 }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      this.logger.error(
        `InsightFace retornou ${response.status}: ${errorText}`,
      );
      throw new Error(`InsightFace retornou erro ${response.status}`);
    }

    const payload = (await response.json()) as InsightFaceResponse;

    if (!payload.embedding || payload.embedding.length === 0) {
      throw new Error('InsightFace não retornou embedding');
    }

    return {
      embedding: payload.embedding,
      detection: {
        confidence: payload.detection?.score ?? 0,
        boundingBox: payload.detection?.bbox,
        landmarks: payload.detection?.landmarks,
      },
      quality: payload.quality,
      liveness: payload.liveness
        ? { passed: payload.liveness.passed, score: payload.liveness.score }
        : undefined,
    };
  }
}
