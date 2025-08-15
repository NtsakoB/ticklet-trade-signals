from typing import Optional, Dict, Any
import os
from .supabase_client import get_client

TABLE = os.getenv("SETTINGS_TABLE", "ticklet_settings")

DEFAULTS: Dict[str, Any] = {
    "volume_filter_min": int(os.getenv("VOLUME_FILTER_MIN", "200000")),
    "risk_per_trade": float(os.getenv("RISK_PER_TRADE", "0.05")),
    "max_concurrent_trades": int(os.getenv("MAX_CONCURRENT_TRADES", "10")),
    "ai_enabled": os.getenv("AI_ENABLED", "true").lower() == "true",
    "ai_late_entry_prob_min": float(os.getenv("AI_LATE_ENTRY_PROB_MIN", "0.55")),
    "ai_extend_prob_min": float(os.getenv("AI_EXTEND_PROB_MIN", "0.60")),
    "ai_reentry_prob_min": float(os.getenv("AI_REENTRY_PROB_MIN", "0.58")),
    "min_rr_tp2": float(os.getenv("MIN_RR_TP2", "1.5")),
    "max_overextension_atr": float(os.getenv("MAX_OVEREXTENSION_ATR", "3.0")),
}

def _merge_defaults(data: Optional[Dict[str, Any]]) -> Dict[str, Any]:
    out = dict(DEFAULTS)
    if isinstance(data, dict):
        out.update({k: v for k, v in data.items() if v is not None})
    return out

def get_settings(user_id: Optional[str] = None) -> Dict[str, Any]:
    """
    Returns settings for user_id; on 204/empty/errors, returns DEFAULTS.
    """
    sb = get_client()
    try:
        q = sb.table(TABLE).select("*")
        if user_id:
            q = q.eq("user_id", user_id)
        r = q.maybe_single().execute()
        data = getattr(r, "data", None)
        if not data:
            return _merge_defaults(None)
        if isinstance(data, list):
            data = data[0] if data else None
        return _merge_defaults(data)
    except Exception:
        return _merge_defaults(None)