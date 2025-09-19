from fastapi import APIRouter

router = APIRouter(prefix="/api", tags=["settings"])

@router.get("/settings/trading")
def get_trading_settings():
    """Get trading configuration settings"""
    return {
        "min_volume_usd": 50000,
        "min_confidence": 0.30,
        "max_signals": 50,
        "risk_per_trade": 0.02,
        "max_open_trades": 10,
        "use_dynamic_leverage": True,
        "default_leverage": 5,
        "stop_loss_pct": 0.03,
        "take_profit_levels": [0.02, 0.05, 0.08]
    }