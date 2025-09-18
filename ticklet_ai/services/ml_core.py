import pandas as pd, numpy as np, joblib, math
from pathlib import Path
from typing import Dict, Any, Tuple
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, roc_auc_score
from sklearn.ensemble import RandomForestClassifier
from ..utils.paths import DATA_DIR, MODELS_DIR
from ..utils.ml_store import add_curve_point

TRADES = DATA_DIR / "trades.csv"
MODEL = MODELS_DIR / "rf_model.pkl"

FEATURE_COLS = ["rsi","macd","vol","atr","ema_fast","ema_slow","bb_upper","bb_lower",
                "funding_rate","spread","bid_ask_imbalance","volatility","regime",
                "trending_score","anomaly_score"]

def _load() -> Tuple[pd.DataFrame, pd.Series]:
    if not TRADES.exists():
        raise FileNotFoundError("data/trades.csv not found")
    df = pd.read_csv(TRADES)
    df = df.replace([np.inf,-np.inf], np.nan).dropna(subset=["pnl_pct"])
    if "win" not in df.columns:
        df["win"] = (df["pnl_pct"] > 0).astype(int)
    X = df[FEATURE_COLS].select_dtypes(include=[np.number]).fillna(0.0)
    y = df["win"].astype(int)
    return X, y

def train() -> Dict[str, Any]:
    X, y = _load()
    Xtr, Xte, ytr, yte = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
    model = RandomForestClassifier(n_estimators=300, min_samples_split=4, min_samples_leaf=2, n_jobs=-1, random_state=42)
    model.fit(Xtr, ytr)
    yhat = model.predict(Xte)
    acc = accuracy_score(yte, yhat)
    try:
        yprob = model.predict_proba(Xte)[:,1]
        auc = roc_auc_score(yte, yprob)
    except Exception:
        auc = float("nan")
    joblib.dump(model, MODEL)
    add_curve_point("learning_curve", {"accuracy": round(float(acc),4), "auc": None if math.isnan(auc) else round(float(auc),4), "n_samples": int(len(y))})
    return {"accuracy": float(acc), "auc": None if math.isnan(auc) else float(auc), "samples": int(len(y)), "model_path": str(MODEL)}