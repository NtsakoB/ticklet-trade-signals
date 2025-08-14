from fastapi import APIRouter, Query
from ..services.signal_filter import rideout_should_alert
from ..services.settings_store import get_settings

router = APIRouter(prefix="/backtest", tags=["backtest"])

@router.get("/run")
def run(symbol: str = Query("BTCUSDT"), interval: str = Query("1h"), bars: int = Query(500)):
    # In a real impl, fetch klines & compute signals per bar. Here we simulate:
    s = get_settings()
    volume_filter = s.get("volume_filter", 0.0)
    hits = 0
    misses = 0
    
    for i in range(bars):
        price_now = 68000.0
        entry_low, entry_high = 67900.0, 68100.0
        rr_tp2 = 1.8
        vol = 100000 + i
        
        if vol < volume_filter:
            misses += 1
            continue
            
        ok = rideout_should_alert(price_now=price_now, entry_low=entry_low, entry_high=entry_high,
                                  rr_tp2=rr_tp2, late_p=0.62, extend_p=0.64, reentry_p=0.60, overext_atr=1.2)
        hits += 1 if ok else 0
        
    return {"symbol":symbol, "bars":bars, "volume_filter":volume_filter, "signals":hits, "skipped":misses}