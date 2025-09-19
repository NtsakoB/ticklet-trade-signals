from fastapi import APIRouter, Query, HTTPException
from typing import List, Dict, Any
from enum import Enum
import time, uuid, logging

# Import your actual data sources/utilities
# Supabase client for database operations
import os
from supabase import create_client, Client

def get_supabase_client() -> Client:
    url = os.environ["SUPABASE_URL"]
    key = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
    return create_client(url, key)

def get_candidates() -> List[Dict[str, Any]]:
    """Get signals from Supabase database"""
    try:
        supabase = get_supabase_client()
        response = supabase.table("signals").select("*").order("created_at", desc=True).limit(100).execute()
        return response.data or []
    except Exception as e:
        logger.error(f"Failed to fetch signals from database: {e}")
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
    entry_price = float(candidate.get("entry_price") or 0)
    targets = candidate.get("targets", [])
    if isinstance(targets, dict):  # Handle jsonb targets
        targets = [targets.get(f"tp{i}", 0) for i in range(1, 4)]
    
    # Calculate RR ratio from targets
    rr_tp2 = 0
    if isinstance(targets, list) and len(targets) >= 2 and targets[1] and entry_price:
        rr_tp2 = (targets[1] / entry_price) - 1
    
    conf = candidate.get("confidence", 0.5)
    if conf > 1:  # normalize if already in 0..100
        conf = conf / 100.0
    conf_pct = int(conf * 100)
    side = str(candidate.get("side", "BUY")).upper()
    
    tags = []
    if rr_tp2 > 0:
        tags.append(f"RR: {rr_tp2:.2f}")
    if candidate.get("low_entry"):
        tags.append("Low Entry")

    return {
        "id": candidate.get("id", f"{list_type}_{symbol}_{int(time.time())}"),
        "symbol": symbol,
        "title": f"Entry: ${entry_price:.4f}" if entry_price else side,
        "subtitle": f"{side} Signal",
        "confidence": conf_pct,
        "price": entry_price,
        "change_pct": 0,  # Would need real-time price data to calculate
        "time": candidate.get("created_at", "")[:5] if candidate.get("created_at") else time.strftime("%H:%M"),
        "tags": tags,
        "entry_low": entry_price * 0.999,  # Slight range for entry
        "entry_high": entry_price * 1.001,
        "stop_loss": float(candidate.get("stop_loss") or candidate.get("stop_price") or 0),
        "targets": targets if isinstance(targets, list) else [0, 0, 0],
        "rr_ratio": rr_tp2,
        "volume": 0,  # Would need market data integration
        "raw_data": candidate,
    }

def _get_active(cands: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    out = []
    for c in cands[:50]:
        if c.get("status") in ("active", "open"):
            out.append(_format_signal(c, "active"))
    # Highest confidence first
    return sorted(out, key=lambda x: x.get("confidence", 0), reverse=True)

def _get_recent(cands: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    return [_format_signal(c, "recent") for c in cands[:10]]

def _get_missed(cands: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    out = []
    for c in cands[:20]:
        if c.get("status") == "missed":
            s = _format_signal(c, "missed")
            s["tags"] = s.get("tags", []) + ["Missed"]
            out.append(s)
    return out[:10]

def _get_lowest(cands: List[Dict[str, Any]], stricter: bool) -> List[Dict[str, Any]]:
    out = []
    for c in cands:
        conf = c.get("confidence", 0.5)
        if conf > 1:
            conf = conf / 100.0
        
        # For stricter (low_entry), filter by low_entry flag and higher confidence
        if stricter and c.get("low_entry") and conf > 0.6:
            s = _format_signal(c, "low_entry")
            s["tags"] = s.get("tags", []) + ["Low Risk Entry"]
            out.append(s)
        # For general lowest, include all active signals sorted by price_distance
        elif not stricter and c.get("status") in ("active", "open"):
            s = _format_signal(c, "lowest")
            s["tags"] = s.get("tags", []) + ["Opportunity"]
            out.append(s)
    
    # Sort by price_distance (closest to entry first) or confidence
    sort_key = lambda x: float(x.get("raw_data", {}).get("price_distance", 999999))
    return sorted(out, key=sort_key)[:15]

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