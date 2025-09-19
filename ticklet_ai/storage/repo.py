import os, csv
from pathlib import Path
from typing import Dict, Any, List, Optional
from supabase import create_client, Client
from ..utils.paths import DATA_DIR

SIGNALS_CSV  = DATA_DIR / "signals.csv"
FEATURES_CSV = DATA_DIR / "features.csv"
TRADES_CSV   = DATA_DIR / "trades.csv"
ACTIONS_CSV  = DATA_DIR / "actions.csv"

SIGNALS_HEADER = [
  "ts_utc","symbol","timeframe","strategy","status","side","entry_low","entry_high",
  "stop","tp1","tp2","tp3","confidence","anomaly","pump_conf","raw"
]
FEATURES_HEADER = [
  "ts_utc","symbol","timeframe","strategy","rsi","macd","vol","atr","ema_fast","ema_slow",
  "bb_upper","bb_lower","funding_rate","spread","bid_ask_imbalance","volatility","regime",
  "trending_score","anomaly_score","raw"
]
TRADES_HEADER = [
  "trade_id","ts_open","ts_close","symbol","strategy","side","timeframe","entry","exit",
  "hold_minutes","pnl_pct","win","rsi","macd","vol","atr","ema_fast","ema_slow","bb_upper","bb_lower",
  "funding_rate","spread","bid_ask_imbalance","volatility","regime","trending_score","anomaly_score","raw"
]
ACTIONS_HEADER = ["ts_utc","event","symbol","strategy","timeframe","details"]

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
        with path.open("w", newline="") as f:
            csv.writer(f).writerow(header)

def _csv_append(path: Path, header: List[str], record: Dict[str, Any]):
    _ensure_csv(path, header)
    with path.open("a", newline="") as f:
        csv.writer(f).writerow([record.get(h,"") for h in header])

def upsert_signal(rec: Dict[str, Any]) -> None:
    sb = _sb()
    if sb:
        sb.schema(_schema()).table("signals").upsert(rec).execute()
    else:
        _csv_append(SIGNALS_CSV, SIGNALS_HEADER, rec)

def upsert_features(rec: Dict[str, Any]) -> None:
    sb = _sb()
    if sb:
        sb.schema(_schema()).table("features").upsert(rec).execute()
    else:
        _csv_append(FEATURES_CSV, FEATURES_HEADER, rec)

def upsert_trade(rec: Dict[str, Any]) -> None:
    sb = _sb()
    if sb:
        sb.schema(_schema()).table("trades").upsert(rec).execute()
    else:
        _csv_append(TRADES_CSV, TRADES_HEADER, rec)

def log_action(event: str, details: Dict[str, Any]) -> None:
    rec = {
      "ts_utc": details.get("ts_utc"),
      "event": event,
      "symbol": details.get("symbol",""),
      "strategy": details.get("strategy",""),
      "timeframe": details.get("timeframe",""),
      "details": details
    }
    sb = _sb()
    if sb:
        sb.schema(_schema()).table("actions").insert(rec).execute()
    else:
        _csv_append(ACTIONS_CSV, ACTIONS_HEADER, rec)