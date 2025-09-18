import time
from typing import Dict, Any
from ..storage.repo import upsert_trade, log_action
from .features import build_features_from_result

def _ts() -> int:
    return int(time.time())

def log_open(trade_id: str, symbol: str, strategy: str, side: str, timeframe: str, entry: float, result: Dict[str,Any]):
    feats = build_features_from_result(symbol, timeframe, strategy, result)
    rec = {
      "trade_id": trade_id, "ts_open": _ts(), "ts_close": "",
      "symbol": symbol, "strategy": strategy, "side": side, "timeframe": timeframe,
      "entry": entry, "exit": "", "hold_minutes": "", "pnl_pct": "", "win": "",
      **feats, "raw": result
    }
    upsert_trade(rec)
    log_action("trade_open", {"ts_utc": _ts(), "trade_id": trade_id, "symbol": symbol, "strategy": strategy, "timeframe": timeframe, "entry": entry})

def log_update(trade_id: str, updates: Dict[str, Any]):
    rec = {"trade_id": trade_id, **updates}
    upsert_trade(rec)
    log_action("trade_update", {"ts_utc": _ts(), "trade_id": trade_id, **updates})

def log_close(trade_id: str, exit_price: float, hold_minutes: int, pnl_pct: float):
    win = 1 if pnl_pct > 0 else 0
    rec = {"trade_id": trade_id, "ts_close": _ts(), "exit": exit_price, "hold_minutes": hold_minutes, "pnl_pct": pnl_pct, "win": win}
    upsert_trade(rec)
    log_action("trade_close", {"ts_utc": _ts(), "trade_id": trade_id, "exit": exit_price, "hold_minutes": hold_minutes, "pnl_pct": pnl_pct, "win": win})
    return win