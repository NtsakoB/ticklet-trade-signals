import os, time, csv
from pathlib import Path
from typing import Dict, Any, List, Optional
from supabase import create_client, Client
from ..utils.paths import DATA_DIR

SIGNALS_CSV = DATA_DIR / "signals.csv"
FEATURES_CSV = DATA_DIR / "features.csv"

SIGNALS_HEADER = [
  "ts_utc","symbol","timeframe","strategy","status","side","entry_low","entry_high",
  "stop","tp1","tp2","tp3","confidence","anomaly","pump_conf","raw"
]

FEATURES_HEADER = [
  "ts_utc","symbol","timeframe","strategy","rsi","macd","vol","atr","ema_fast","ema_slow",
  "bb_upper","bb_lower","funding_rate","spread","bid_ask_imbalance","volatility","regime",
  "trending_score","anomaly_score","raw"
]

def _sb() -> Optional[Client]:
    url = os.getenv("TICKLET_SUPABASE_URL") or ""
    key = os.getenv("TICKLET_SUPABASE_ANON_KEY") or ""
    if not url or not key:
        return None
    return create_client(url, key)

def _schema() -> str:
    return os.getenv("TICKLET_SUPABASE_SCHEMA","public")

def _ensure_csv(path: Path, header: List[str]):
    path.parent.mkdir(parents=True, exist_ok=True)
    if not path.exists():
        import csv
        with path.open("w", newline="") as f:
            csv.writer(f).writerow(header)

def upsert_signal(record: Dict[str, Any]) -> None:
    sb = _sb()
    if sb:
        sb.schema(_schema()).table("signals").upsert(record).execute()
        return
    _ensure_csv(SIGNALS_CSV, SIGNALS_HEADER)
    with SIGNALS_CSV.open("a", newline="") as f:
        csv.writer(f).writerow([record.get(h,"") for h in SIGNALS_HEADER])

def upsert_features(record: Dict[str, Any]) -> None:
    sb = _sb()
    if sb:
        sb.schema(_schema()).table("features").upsert(record).execute()
        return
    _ensure_csv(FEATURES_CSV, FEATURES_HEADER)
    with FEATURES_CSV.open("a", newline="") as f:
        csv.writer(f).writerow([record.get(h,"") for h in FEATURES_HEADER])