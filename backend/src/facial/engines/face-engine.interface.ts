export interface FaceDetection {
  confidence: number;
  boundingBox?: [number, number, number, number];
  landmarks?: number[][];
}

export interface LivenessResult {
  passed: boolean;
  score?: number;
  signals?: Record<string, unknown>;
}

export interface EmbeddingResult {
  embedding: number[];
  detection: FaceDetection;
  quality?: number;
  liveness?: LivenessResult;
}

export interface FaceEngine {
  detectAndEmbed(imageBase64: string): Promise<EmbeddingResult>;
}
