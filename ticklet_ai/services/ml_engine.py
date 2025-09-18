import time, threading, pandas as pd
from ..utils.paths import DATA_DIR
from .ml_core import train
_last = 0
_lock = threading.Lock()

def maybe_train_async(min_rows=80, cooldown_minutes=30):
    global _last
    TRADES = DATA_DIR / "trades.csv"
    if not TRADES.exists(): return
    try:
        df = pd.read_csv(TRADES)
        enough = len(df.dropna(subset=["pnl_pct"])) >= min_rows
    except Exception:
        return
    if not enough: return
    now = time.time()
    if now - _last < cooldown_minutes*60: return
    with _lock:
        _last = now
    threading.Thread(target=train, daemon=True).start()