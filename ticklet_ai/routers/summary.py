# Summary Endpoints
# /summary routes for dashboard data

from fastapi import APIRouter, HTTPException, Depends
from typing import Dict, Any, Optional
import logging
from ticklet_ai.services.supabase_client import get_supabase_client
from ticklet_ai.utils.csv_fallback import get_csv_fallback_data

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/summary", tags=["summary"])

@router.get("/dashboard")
async def get_dashboard_summary() -> Dict[str, Any]:
    """
    Get dashboard summary with active_signals, executed_trades, win_rate, and capital_at_risk.
    Uses Supabase as primary source with CSV fallback.
    """
    try:
        # Try Supabase first
        supabase = get_supabase_client()
        
        # Get active signals count
        active_signals_response = supabase.table("signals").select("id", count="exact").eq("status", "active").execute()
        active_signals = active_signals_response.count or 0
        
        # Get executed trades count (closed paper trades)
        executed_trades_response = supabase.table("paper_trades").select("id", count="exact").eq("status", "closed").execute()
        executed_trades = executed_trades_response.count or 0
        
        # Calculate win rate from closed trades
        if executed_trades > 0:
            winning_trades_response = supabase.table("paper_trades").select("id", count="exact").eq("status", "closed").gt("pnl", 0).execute()
            winning_trades = winning_trades_response.count or 0
            win_rate = winning_trades / executed_trades
        else:
            win_rate = 0.0
        
        # Calculate capital at risk from open paper trades
        open_trades_response = supabase.table("paper_trades").select("entry_price,qty,leverage").eq("status", "open").execute()
        capital_at_risk = 0.0
        if open_trades_response.data:
            for trade in open_trades_response.data:
                position_size = trade["entry_price"] * trade["qty"]
                leverage = trade.get("leverage", 1) or 1
                capital_at_risk += position_size * leverage
        
        return {
            "active_signals": active_signals,
            "executed_trades": executed_trades,
            "win_rate": win_rate,
            "capital_at_risk": capital_at_risk,
            "data_source": "supabase"
        }
        
    except Exception as e:
        logger.warning(f"Supabase query failed, falling back to CSV: {e}")
        
        # Fall back to CSV data
        try:
            csv_data = get_csv_fallback_data()
            return {
                "active_signals": csv_data.get("active_signals", 5),
                "executed_trades": csv_data.get("executed_trades", 23),
                "win_rate": csv_data.get("win_rate", 0.65),
                "capital_at_risk": csv_data.get("capital_at_risk", 12500.0),
                "data_source": "csv_fallback"
            }
        except Exception as csv_error:
            logger.error(f"CSV fallback also failed: {csv_error}")
            
            # Last resort: return mock data with clear indication
            return {
                "active_signals": 3,
                "executed_trades": 15,
                "win_rate": 0.6,
                "capital_at_risk": 8500.0,
                "data_source": "mock_data"
            }

@router.get("/daily")
def get_daily_summary():
    """Legacy endpoint - redirect to dashboard summary"""
    return {"message": "Use /summary/dashboard for comprehensive dashboard data"}