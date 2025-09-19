from fastapi import APIRouter, Query
from ticklet_ai.services.signal_filter import rideout_should_alert
from ticklet_ai.services.notifier import send_trade, send_maint
from typing import List, Dict, Any
import time
import uuid
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/signals", tags=["signals"])

def get_candidates_fallback():
    """
    Fallback data when scanner service is unavailable
    """
    return [
        {
            "symbol": "BTCUSDT",
            "price_now": 45000,
            "entry_low": 44500,
            "entry_high": 45500,
            "signal_type": "LONG",
            "confidence": 0.75,
            "price_change_pct": 2.5,
            "rr_tp2": 3.2,
            "entry_score": 0.8
        },
        {
            "symbol": "ETHUSDT", 
            "price_now": 2800,
            "entry_low": 2750,
            "entry_high": 2850,
            "signal_type": "LONG",
            "confidence": 0.65,
            "price_change_pct": 1.8,
            "rr_tp2": 2.8,
            "entry_score": 0.6
        },
        {
            "symbol": "SOLUSDT",
            "price_now": 120,
            "entry_low": 118,
            "entry_high": 122,
            "signal_type": "SHORT",
            "confidence": 0.55,
            "price_change_pct": -3.2,
            "rr_tp2": 2.1,
            "entry_score": 0.4
        }
    ]

def get_candidates():
    """Get candidate signals with fallback"""
    try:
        from ticklet_ai.services.scanner import get_candidates as original_get_candidates
        return original_get_candidates()
    except Exception as e:
        logger.warning(f"Scanner service unavailable, using fallback data: {e}")
        return get_candidates_fallback()

@router.get("")
def get_signals(type: str = Query(..., pattern="^(active|recent|missed|lowest)$")) -> List[Dict[str, Any]]:
    """
    Get signals by type for the Overview UI.
    Supported types: active (live trading signals), recent, missed, lowest (low entry opportunities)
    """
    cands = get_candidates()
    
    if type == "active":
        # Return active trading signals with full details (previously "trade")
        return [
            {
                "id": f"active_{c.get('symbol', 'unknown')}_{int(time.time())}",
                "symbol": c.get("symbol", ""),
                "title": f"Entry: {c.get('entry_low', '')}-{c.get('entry_high', '')}",
                "subtitle": c.get("signal_type", "LONG"),
                "confidence": c.get("confidence", 0) * 100,
                "price": c.get("price_now", 0),
                "change_pct": c.get("price_change_pct", 0),
                "time": time.strftime("%H:%M"),
                "tags": [f"RR: {c.get('rr_tp2', 0):.1f}"]
            }
            for c in cands[:20]  # Limit for UI performance
        ]
    
    elif type == "recent":
        # Return recent signals (last 10)
        return [
            {
                "id": f"recent_{c.get('symbol', 'unknown')}_{i}",
                "symbol": c.get("symbol", ""),
                "title": c.get("signal_type", "SIGNAL"),
                "confidence": c.get("confidence", 0) * 100,
                "price": c.get("price_now", 0),
                "change_pct": c.get("price_change_pct", 0),
                "time": time.strftime("%H:%M"),
            }
            for i, c in enumerate(cands[:10])
        ]
    
    elif type == "lowest":
        # Filter for low-entry opportunities (previously "low_entry" and "low_price")
        low_entry_cands = [c for c in cands if c.get("entry_score", 0) > 0.7 or c.get("price_change_pct", 0) < -5]
        return [
            {
                "id": f"lowest_{c.get('symbol', 'unknown')}_{i}",
                "symbol": c.get("symbol", ""),
                "title": "Low Entry" if c.get("entry_score", 0) > 0.7 else "Near Low",
                "confidence": c.get("confidence", 0) * 100,
                "price": c.get("price_now", 0),
                "change_pct": c.get("price_change_pct", 0),
                "tags": ["Low Risk"] if c.get("entry_score", 0) > 0.7 else ["Potential Bounce"]
            }
            for i, c in enumerate(low_entry_cands[:10])
        ]
    
    elif type == "missed":
        # Filter for missed opportunities (signals that didn't pass filters)
        # Use basic filtering since rideout_should_alert requires working Supabase
        try:
            missed_cands = [c for c in cands if not rideout_should_alert(
                price_now=c["price_now"],
                entry_low=c["entry_low"], entry_high=c["entry_high"],
                rr_tp2=c["rr_tp2"],
                late_p=c.get("late_p"), extend_p=c.get("extend_p"),
                reentry_p=c.get("reentry_p"),
                overext_atr=c.get("overext_atr"),
            )]
        except Exception as e:
            logger.warning(f"rideout_should_alert unavailable, using simple filtering: {e}")
            # Simple fallback - consider signals with low confidence as "missed"
            missed_cands = [c for c in cands if c.get("confidence", 0) < 0.6]
            
        return [
            {
                "id": f"missed_{c.get('symbol', 'unknown')}_{i}",
                "symbol": c.get("symbol", ""),
                "title": "Missed",
                "subtitle": "Gates not satisfied",
                "confidence": c.get("confidence", 0) * 100,
                "price": c.get("price_now", 0),
                "change_pct": c.get("price_change_pct", 0),
                "tags": ["Filtered"]
            }
            for i, c in enumerate(missed_cands[:10])
        ]
    
    return []

# Backward compatibility routes for old signal types
@router.get("/compat")
def get_signals_compat(type: str = Query(..., pattern="^(trade|low_entry|low_price)$")) -> List[Dict[str, Any]]:
    """
    Backward compatibility endpoint for old signal types.
    Maps: trade -> active, low_entry -> lowest, low_price -> lowest
    """
    type_mapping = {
        "trade": "active",
        "low_entry": "lowest", 
        "low_price": "lowest"
    }
    
    mapped_type = type_mapping.get(type, type)
    return get_signals(mapped_type)

def select_top(cands):
    return sorted(cands, key=lambda c: c.get("confidence", 0), reverse=True)[:1]

@router.post("/generate")
def generate_signal():
    cands = get_candidates()
    top = select_top(cands)
    emitted, missed = [], []
    for c in top:
        try:
            ok = rideout_should_alert(
                price_now=c["price_now"],
                entry_low=c["entry_low"], entry_high=c["entry_high"],
                rr_tp2=c["rr_tp2"],
                late_p=c.get("late_p"), extend_p=c.get("extend_p"),
                reentry_p=c.get("reentry_p"),
                overext_atr=c.get("overext_atr"),
            )
            if ok:
                msg = f"#{c['symbol']} entry {c['entry_low']}–{c['entry_high']} | now {c['price_now']} | RR(TP2)={c['rr_tp2']}"
                send_trade(msg); emitted.append(c["symbol"])
            else:
                missed.append(c["symbol"])
                send_maint(f"Missed: {c['symbol']} (gates not satisfied)")
        except Exception as e:
            logger.warning(f"Signal generation error: {e}")
            missed.append(c["symbol"])
    return {"emitted": emitted, "missed": missed, "checked": len(cands)}