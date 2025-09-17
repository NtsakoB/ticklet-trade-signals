"""
Silent background collector: enriches latest candles with ai_confidence, ml_confidence,
anomaly_score, usd_volume, not_delisted, btc_corr_ok — so strategies can run quietly.
"""
from __future__ import annotations
import logging
import datetime as dt
import pandas as pd

logger = logging.getLogger(__name__)

# ---- Plug these with your existing services (stubs here) ----
def fetch_latest_candles() -> dict[str, pd.DataFrame]:
    # { "BTCUSDT": df, "ETHUSDT": df, ... } – Align with your data feed
    return {}

def compute_ai_confidence(df: pd.DataFrame) -> pd.Series:
    # Replace with your real AI scorer
    return pd.Series(0.6, index=df.index, name="ai_confidence")

def compute_ml_confidence(df: pd.DataFrame) -> pd.Series:
    # Replace with your real ML predictor
    return pd.Series(0.6, index=df.index, name="ml_confidence")

def compute_anomaly(df: pd.DataFrame) -> pd.Series:
    # Replace with your anomaly score
    return pd.Series(0.5, index=df.index, name="anomaly_score")

def compute_usd_volume(df: pd.DataFrame) -> pd.Series:
    # Replace with your true USD volume calc
    return pd.Series(150_000, index=df.index, name="usd_volume")

def compute_flags(df: pd.DataFrame) -> tuple[pd.Series, pd.Series]:
    return (
        pd.Series(True, index=df.index, name="not_delisted"),
        pd.Series(True, index=df.index, name="btc_corr_ok"),
    )

def enrich_loop():
    try:
        books = fetch_latest_candles()
        for symbol, df in books.items():
            if df.empty:
                continue
            df["ai_confidence"] = compute_ai_confidence(df)
            df["ml_confidence"] = compute_ml_confidence(df)
            df["anomaly_score"] = compute_anomaly(df)
            df["usd_volume"]    = compute_usd_volume(df)
            nd, btcok = compute_flags(df)
            df["not_delisted"]  = nd
            df["btc_corr_ok"]   = btcok
            # TODO: persist for strategies (cache/db/bus) according to your existing pipeline
        logger.info("collector.enrich_loop: OK")
    except Exception as e:
        logger.exception("collector.enrich_loop failed: %s", e)