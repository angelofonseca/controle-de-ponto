import { FaceMatchDecision } from '../generated/prisma/enums';

export interface FaceThresholdPolicy {
    accept: number;
    review: number;
}

export function resolveDecision(score: number, policy: FaceThresholdPolicy): FaceMatchDecision {
    if (score >= policy.accept) {
        return FaceMatchDecision.APPROVED;
    }

    if (score >= policy.review) {
        return FaceMatchDecision.REVIEW;
    }

    return FaceMatchDecision.REJECTED;
}
