"""
CALL THESE FROM YOUR PAPER-TRADER FLOW:
- on_entry_opened(...)
- on_trade_updated(...)
- on_trade_closed(...)
Map parameters to your actual trade engine fields.
"""
from typing import Dict, Any
from ..services.trade_logger import log_open, log_update, log_close
from ..services.ml_engine import maybe_train_async

def on_entry_opened(trade_id: str, symbol: str, strategy: str, side: str, timeframe: str, entry: float, result: Dict[str,Any]):
    log_open(trade_id, symbol, strategy, side, timeframe, entry, result)

def on_trade_updated(trade_id: str, updates: Dict[str,Any]):
    log_update(trade_id, updates)

def on_trade_closed(trade_id: str, exit_price: float, hold_minutes: int, pnl_pct: float):
    win = log_close(trade_id, exit_price, hold_minutes, pnl_pct)
    maybe_train_async(min_rows=80, cooldown_minutes=30)
    return win