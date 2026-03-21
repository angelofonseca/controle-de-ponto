import logging

from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse

from .face_engine import detect_and_embed, get_face_app
from .schemas import EmbedRequest, EmbedResponse

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)

app = FastAPI(title="Face Service", version="1.0.0")


@app.on_event("startup")
async def startup():
    """Pré-carrega o modelo InsightFace na inicialização."""
    get_face_app()


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.post("/api/v1/face/embed", response_model=EmbedResponse)
async def embed(request: EmbedRequest):
    try:
        result = detect_and_embed(request.imageBase64)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logging.getLogger(__name__).error(f"Erro ao processar imagem: {e}")
        raise HTTPException(status_code=500, detail="Erro interno ao processar imagem.")
