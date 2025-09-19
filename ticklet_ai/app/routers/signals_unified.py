from fastapi import APIRouter, Query, HTTPException
from typing import List, Dict, Any
from enum import Enum
import time, uuid, logging

# Import your actual data sources/utilities
try:
    from ticklet_ai.services.scanner import get_candidates
except Exception:
    # Safe fallback: return empty list if scanner isn't wired yet
    def get_candidates() -> List[Dict[str, Any]]:
        return []

try:
    from ticklet_ai.services.signal_filter import rideout_should_alert
except Exception:
    def rideout_should_alert(**kwargs) -> bool:
        # Be conservative by default if filter not wired
        return False

logger = logging.getLogger(__name__)

# Primary router under /api
router = APIRouter(prefix="/api", tags=["signals"])
# Legacy alias router at root to satisfy calls like GET /signals?type=missed
legacy_router = APIRouter(prefix="", tags=["signals-legacy"])

class SignalType(str, Enum):
    active = "active"
    recent = "recent"
    missed = "missed"
    lowest = "lowest"
    # legacy
    trade = "trade"          # map -> active
    low_entry = "low_entry"  # map -> lowest (stricter)
    low_price = "low_price"  # map -> lowest

def _format_signal(candidate: Dict[str, Any], list_type: str) -> Dict[str, Any]:
    symbol = candidate.get("symbol", "UNKNOWN")
    entry_low = float(candidate.get("entry_low") or 0)
    entry_high = float(candidate.get("entry_high") or 0)
    rr_tp2 = float(candidate.get("rr_tp2") or 0)
    price_now = float(candidate.get("price_now") or candidate.get("price") or 0)
    change = float(candidate.get("price_change_pct") or candidate.get("change_pct") or 0)
    conf = candidate.get("confidence", candidate.get("ai_confidence", 0.5))
    if conf > 1:  # normalize if already in 0..100
        conf = conf / 100.0
    conf_pct = int(conf * 100)
    side = str(candidate.get("signal_type", candidate.get("side", "LONG"))).upper()
    volume = float(candidate.get("volume") or candidate.get("quote_volume") or 0)

    tags = []
    if rr_tp2 > 0:
        tags.append(f"RR: {rr_tp2:.1f}")
    if volume > 1_000_000:
        tags.append(f"Vol: ${volume/1_000_000:.1f}M")

    return {
        "id": f"{list_type}_{symbol}_{int(time.time())}_{uuid.uuid4().hex[:8]}",
        "symbol": symbol,
        "title": f"Entry: {entry_low:.4f}-{entry_high:.4f}" if entry_low and entry_high else side,
        "subtitle": side,
        "confidence": conf_pct,          # integer %
        "price": price_now,
        "change_pct": round(change, 2),
        "time": time.strftime("%H:%M"),
        "tags": tags,
        "entry_low": entry_low,
        "entry_high": entry_high,
        "stop_loss": float(candidate.get("stop_loss") or candidate.get("stop") or 0),
        "targets": [
            float(candidate.get("tp1") or 0),
            float(candidate.get("tp2") or 0),
            float(candidate.get("tp3") or 0),
        ],
        "rr_ratio": rr_tp2,
        "volume": volume,
        "raw_data": candidate,
    }

def _get_active(cands: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    out = []
    for c in cands[:50]:
        if rideout_should_alert(
            price_now=c.get("price_now", 0),
            entry_low=c.get("entry_low", 0),
            entry_high=c.get("entry_high", 0),
            rr_tp2=c.get("rr_tp2", 0),
            late_p=c.get("late_p"),
            extend_p=c.get("extend_p"),
            reentry_p=c.get("reentry_p"),
            overext_atr=c.get("overext_atr"),
        ):
            out.append(_format_signal(c, "active"))
    # Highest confidence first
    return sorted(out, key=lambda x: x.get("confidence", 0), reverse=True)

def _get_recent(cands: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    return [_format_signal(c, "recent") for c in cands[:10]]

def _get_missed(cands: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    out = []
    for c in cands[:20]:
        if not rideout_should_alert(
            price_now=c.get("price_now", 0),
            entry_low=c.get("entry_low", 0),
            entry_high=c.get("entry_high", 0),
            rr_tp2=c.get("rr_tp2", 0),
            late_p=c.get("late_p"),
            extend_p=c.get("extend_p"),
            reentry_p=c.get("reentry_p"),
            overext_atr=c.get("overext_atr"),
        ):
            s = _format_signal(c, "missed")
            s["tags"] = s.get("tags", []) + ["Filtered"]
            out.append(s)
    return out[:10]

def _get_lowest(cands: List[Dict[str, Any]], stricter: bool) -> List[Dict[str, Any]]:
    out = []
    threshold = -3.0 if stricter else -1.0
    for c in cands:
        chg = float(c.get("price_change_pct") or 0)
        conf = c.get("confidence", c.get("ai_confidence", 0.5))
        if conf > 1:
            conf = conf / 100.0
        if chg < threshold and (conf > 0.6 if stricter else True):
            s = _format_signal(c, "low_entry" if stricter else "lowest")
            s["tags"] = s.get("tags", []) + (["Low Risk Entry"] if stricter else ["Near Low"])
            out.append(s)
    return sorted(out, key=lambda x: x.get("change_pct", 0))[:15]

def _serve(type_: SignalType) -> List[Dict[str, Any]]:
    try:
        cands = get_candidates()
        if not cands:
            return []
        if type_ in (SignalType.active, SignalType.trade):
            return _get_active(cands)
        if type_ == SignalType.recent:
            return _get_recent(cands)
        if type_ == SignalType.missed:
            return _get_missed(cands)
        if type_ in (SignalType.lowest, SignalType.low_price, SignalType.low_entry):
            return _get_lowest(cands, stricter=(type_ == SignalType.low_entry))
        raise HTTPException(status_code=400, detail=f"Unsupported signal type: {type_}")
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("signals error")
        raise HTTPException(status_code=500, detail="Failed to fetch signals")

@router.get("/signals")
def get_signals(type: SignalType = Query(...)) -> List[Dict[str, Any]]:
    return _serve(type)

@legacy_router.get("/signals")
def get_signals_legacy(type: SignalType = Query(...)) -> List[Dict[str, Any]]:
    return _serve(type)