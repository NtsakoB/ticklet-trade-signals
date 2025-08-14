from fastapi import APIRouter
from ticklet_ai.services.signal_filter import rideout_should_alert
from ticklet_ai.services.scanner import get_candidates
from ticklet_ai.services.notifier import send_trade, send_maint
router = APIRouter(prefix="/signals", tags=["signals"])
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