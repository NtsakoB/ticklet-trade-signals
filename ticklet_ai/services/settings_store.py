from typing import Any, Dict
from ticklet_ai.services.supabase_client import get_client
TABLE = "ticklet_settings"
DEFAULTS = {"volume_filter": 100000.0, "risk_per_trade": 0.01}
def get_settings(user_id: str = "global") -> Dict[str, Any]:
    sb = get_client()
    if not sb:
        return DEFAULTS.copy()
    r = sb.table(TABLE).select("*").eq("user_id", user_id).maybe_single().execute()
    if r.data:
        d = r.data
        return {**DEFAULTS, **{k: d.get(k, DEFAULTS.get(k)) for k in DEFAULTS}}
    sb.table(TABLE).insert({"user_id": user_id, **DEFAULTS}).execute()
    return DEFAULTS.copy()
def set_settings(data: Dict[str, Any], user_id: str = "global") -> Dict[str, Any]:
    sb = get_client(); cur = get_settings(user_id)
    cur.update({k: v for k, v in data.items() if k in DEFAULTS})
    if sb:
        sb.table(TABLE).upsert({"user_id": user_id, **cur}).execute()
    return cur