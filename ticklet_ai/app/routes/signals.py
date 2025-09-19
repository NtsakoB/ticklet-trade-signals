from fastapi import APIRouter, Query
from ticklet_ai.services.signal_filter import rideout_should_alert
from ticklet_ai.services.scanner import get_candidates
from ticklet_ai.services.notifier import send_trade, send_maint
from typing import List, Dict, Any
import time
import uuid

router = APIRouter(prefix="/api/signals", tags=["signals"])

@router.get("")
def get_signals(type: str = Query(..., pattern="^(trade|recent|low_entry|missed|low_price)$")) -> List[Dict[str, Any]]:
    """Get signals by type for the Overview UI"""
    cands = get_candidates()
    
    if type == "trade":
        # Return trade signals with full details
        return [
            {
                "id": f"trade_{c.get('symbol', 'unknown')}_{int(time.time())}",
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
    
    elif type == "low_entry":
        # Filter for low-entry opportunities
        low_entry_cands = [c for c in cands if c.get("entry_score", 0) > 0.7]
        return [
            {
                "id": f"low_entry_{c.get('symbol', 'unknown')}_{i}",
                "symbol": c.get("symbol", ""),
                "title": "Low Entry",
                "confidence": c.get("confidence", 0) * 100,
                "price": c.get("price_now", 0),
                "change_pct": c.get("price_change_pct", 0),
                "tags": ["Low Risk"]
            }
            for i, c in enumerate(low_entry_cands[:10])
        ]
    
    elif type == "missed":
        # Filter for missed opportunities (signals that didn't pass filters)
        missed_cands = [c for c in cands if not rideout_should_alert(
            price_now=c["price_now"],
            entry_low=c["entry_low"], entry_high=c["entry_high"],
            rr_tp2=c["rr_tp2"],
            late_p=c.get("late_p"), extend_p=c.get("extend_p"),
            reentry_p=c.get("reentry_p"),
            overext_atr=c.get("overext_atr"),
        )]
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
    
    elif type == "low_price":
        # Filter for symbols near lowest price
        low_price_cands = [c for c in cands if c.get("price_change_pct", 0) < -5]
        return [
            {
                "id": f"low_price_{c.get('symbol', 'unknown')}_{i}",
                "symbol": c.get("symbol", ""),
                "title": "Near Low",
                "confidence": c.get("confidence", 0) * 100,
                "price": c.get("price_now", 0),
                "change_pct": c.get("price_change_pct", 0),
                "tags": ["Potential Bounce"]
            }
            for i, c in enumerate(low_price_cands[:10])
        ]
    
    return []
def select_top(cands):
    return sorted(cands, key=lambda c: c.get("confidence", 0), reverse=True)[:1]
@router.post("/generate")
def generate_signal():
    cands = get_candidates()
    top = select_top(cands)
    emitted, missed = [], []
    for c in top:
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
    return {"emitted": emitted, "missed": missed, "checked": len(cands)}