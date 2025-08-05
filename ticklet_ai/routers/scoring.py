# Signal Scoring and Learning Endpoints
# /score/signal, /learn routes

from fastapi import APIRouter

router = APIRouter(prefix="/score", tags=["scoring"])

@router.post("/signal")
def score_signal():
    return {"message": "Signal scoring endpoint"}

@router.post("/learn")
def learn_signal():
    return {"message": "Signal learning endpoint"}