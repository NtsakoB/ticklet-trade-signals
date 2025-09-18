from fastapi import APIRouter
from ..schemas.common import MessageResponse
from ...utils.ml_store import get_curve
from ...services.ml_core import train
from ...services.ml_infer import predict_win_prob

router = APIRouter(prefix="/ml", tags=["ML"])

@router.post("/train")
def train_now():
    return train()

@router.get("/status")
def status():
    from ...utils.paths import MODELS_DIR
    mp = (MODELS_DIR / "rf_model.pkl")
    return {"model_exists": mp.exists(), "model_path": str(mp)}

@router.get("/learning_curve")
def learning_curve():
    return get_curve("learning_curve")

@router.post("/predict", response_model=MessageResponse)
def predict(payload: dict):
    p = predict_win_prob(payload.get("features", {}))
    return {"message": str(p)}