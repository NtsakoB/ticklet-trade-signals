from fastapi import APIRouter

router = APIRouter(prefix="/api/strategies", tags=["strategies"])

@router.get("/")
def list_strategies():
    # Include your existing strategies here too (Ticklet Alpha, Golden Hook, etc.)
    return [
        {"id": "ticklet_alpha", "label": "Ticklet Alpha"},
        {"id": "golden_hook",   "label": "Golden Hook"},
        {"id": "bull_strategy", "label": "Bull Strategy"}, 
        {"id": "jam_bot",       "label": "Jam Bot"},
        {"id": "market_regime", "label": "Market Regime"},
        {"id": "condition",     "label": "Condition Strategy"},
    ]