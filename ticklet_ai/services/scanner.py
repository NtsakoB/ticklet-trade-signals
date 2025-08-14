# Canonical scanner (moved from app/services)
from ticklet_ai.services.settings_store import get_settings
def get_candidates():
    s = get_settings()
    vol_min = s.get("volume_filter", 0.0)
    return [{
        "symbol": "BTCUSDT",
        "entry_low": 67900.0,
        "entry_high": 68100.0,
        "price_now": 68010.0,
        "rr_tp2": 1.8,
        "late_p": 0.62,
        "extend_p": 0.64,
        "reentry_p": 0.60,
        "overext_atr": 1.2,
        "volume": 150000.0,
        "confidence": 0.82,
    }] if vol_min <= 150000 else []