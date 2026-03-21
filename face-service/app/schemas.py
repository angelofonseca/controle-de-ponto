from pydantic import BaseModel


class EmbedRequest(BaseModel):
    imageBase64: str


class Detection(BaseModel):
    score: float
    bbox: list[float]
    landmarks: list[list[float]]


class Liveness(BaseModel):
    passed: bool
    score: float


class EmbedResponse(BaseModel):
    embedding: list[float]
    detection: Detection
    quality: float
    liveness: Liveness
