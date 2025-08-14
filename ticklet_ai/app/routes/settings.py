import os
from fastapi import APIRouter, HTTPException
router = APIRouter(prefix="/settings", tags=["settings"])
SAFE_DEFAULTS = {
  "AI_ENABLED": os.getenv("AI_ENABLED", "true"),
  "AI_LATE_ENTRY_PROB_MIN": os.getenv("AI_LATE_ENTRY_PROB_MIN", "0.55"),
  "AI_EXTEND_PROB_MIN": os.getenv("AI_EXTEND_PROB_MIN", "0.60"),
  "AI_REENTRY_PROB_MIN": os.getenv("AI_REENTRY_PROB_MIN", "0.58"),
  "MAX_OVEREXTENSION_ATR": os.getenv("MAX_OVEREXTENSION_ATR", "3.0"),
  "MIN_RR_TP2": os.getenv("MIN_RR_TP2", "1.5"),
  "SIGNAL_LOOP_INTERVAL": os.getenv("SIGNAL_LOOP_INTERVAL", "60"),
  "SCHED_TZ": os.getenv("SCHED_TZ", "Africa/Johannesburg"),
  "SCHEDULER_HOUR": os.getenv("SCHEDULER_HOUR", "10"),
  "SCHEDULER_MINUTE": os.getenv("SCHEDULER_MINUTE", "0"),
  "PREVIEW_MODE": os.getenv("PREVIEW_MODE", "false"),
}
@router.get("")
async def get_safe_settings():
  return SAFE_DEFAULTS
@router.get("/binance/test")
async def test_binance_connectivity():
  if not os.getenv("BINANCE_API_KEY") or not os.getenv("BINANCE_API_SECRET"):
    raise HTTPException(status_code=400, detail="BINANCE credentials not set on server.")
  return {"ok": True, "message": "Server has Binance credentials configured."}