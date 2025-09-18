import joblib, pandas as pd
from pathlib import Path
from ..utils.paths import MODELS_DIR

MODEL = MODELS_DIR / "rf_model.pkl"
FEATURE_COLS = ["rsi","macd","vol","atr","ema_fast","ema_slow","bb_upper","bb_lower",
                "funding_rate","spread","bid_ask_imbalance","volatility","regime",
                "trending_score","anomaly_score"]

def predict_win_prob(features: dict) -> float:
    if not MODEL.exists():
        return 0.50
    model = joblib.load(MODEL)
    x = pd.DataFrame([{k: float(features.get(k, 0.0)) for k in FEATURE_COLS}])
    proba = getattr(model, "predict_proba", None)
    if proba is None:
        return 0.50
    return float(proba(x)[:,1][0])