from fastapi import APIRouter, Query
from typing import List, Dict, Any
import datetime

router = APIRouter(prefix="/api", tags=["trades"])

# Mock data for now - in real implementation, this would connect to your actual trading services
def get_mock_trades(mode: str, strategy: str = None) -> List[Dict[str, Any]]:
    """Mock trade data - replace with actual service calls"""
    base_trades = [
        {
            "id": f"{mode}-1",
            "symbol": "BTCUSDT",
            "side": "long" if mode == "paper" else "buy",
            "strategy": strategy or "TickletAlpha",
            "pnl_abs": 125.50 if mode == "paper" else 89.30,
            "pnl_pct": 2.45 if mode == "paper" else 1.78,
            "time": "2024-01-15 14:30:00",
            "status": "closed",
            "leverage": 10
        },
        {
            "id": f"{mode}-2", 
            "symbol": "ETHUSDT",
            "side": "short" if mode == "paper" else "sell",
            "strategy": strategy or "TickletAlpha",
            "pnl_abs": -45.20 if mode == "paper" else -32.10,
            "pnl_pct": -1.23 if mode == "paper" else -0.89,
            "time": "2024-01-15 13:15:00",
            "status": "closed",
            "leverage": 5
        },
        {
            "id": f"{mode}-3",
            "symbol": "ADAUSDT", 
            "side": "long" if mode == "paper" else "buy",
            "strategy": strategy or "TickletAlpha",
            "pnl_abs": None,
            "pnl_pct": None,
            "time": "2024-01-15 15:45:00",
            "status": "open",
            "leverage": 8
        }
    ]
    
    # Add timestamp variation
    now = datetime.datetime.now()
    for i, trade in enumerate(base_trades):
        timestamp = now - datetime.timedelta(hours=i+1)
        trade["time"] = timestamp.strftime("%Y-%m-%d %H:%M:%S")
    
    return base_trades

@router.get("/trades")
def list_trades(mode: str = Query(..., pattern="^(paper|live)$"),
                strategy: str | None = None) -> List[Dict[str, Any]]:
    # TODO: Replace with actual service calls
    # For paper trades: integrate with your existing PaperTradingService
    # For live trades: integrate with your existing live trading service
    
    try:
        if mode == "paper":
            # rows = get_paper_trades(strategy=strategy) or []
            rows = get_mock_trades("paper", strategy)
        else:
            # rows = get_live_trades(strategy=strategy) or []
            rows = get_mock_trades("live", strategy)
            
        # Normalize shape expected by frontend
        out = []
        for t in rows:
            out.append({
                "id": str(t.get("id") or t.get("trade_id") or t.get("txid") or f"{t.get('symbol','?')}-{t.get('time','?')}"),
                "symbol": t.get("symbol", "-"),
                "side": t.get("side", t.get("position_side", "-")),
                "strategy": t.get("strategy"),
                "pnl_abs": t.get("pnl_abs"),
                "pnl_pct": t.get("pnl_pct"),
                "time": t.get("time"),
                "status": t.get("status"),
                "leverage": t.get("leverage"),
            })
        return out
    except Exception as e:
        # Return empty list on error to prevent UI breakage
        return []