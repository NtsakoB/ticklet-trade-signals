from fastapi import APIRouter, Query
from typing import List, Dict, Any
import datetime

router = APIRouter(prefix="/api", tags=["trades"])

import os
from supabase import create_client, Client

def get_supabase_client() -> Client:
    url = os.environ["SUPABASE_URL"]
    key = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
    return create_client(url, key)

def get_trades_from_db(mode: str, strategy: str = None) -> List[Dict[str, Any]]:
    """Fetch trades from Supabase database"""
    try:
        supabase = get_supabase_client()
        query = supabase.table("trades").select("*").eq("mode", mode)
        
        if strategy:
            query = query.eq("strategy", strategy)
            
        response = query.order("opened_at", desc=True).limit(50).execute()
        return response.data or []
    except Exception as e:
        # Return empty list on error to prevent UI breakage
        return []

@router.get("/trades")
def list_trades(mode: str = Query(..., pattern="^(paper|live)$"),
                strategy: str | None = None) -> List[Dict[str, Any]]:
    # TODO: Replace with actual service calls
    # For paper trades: integrate with your existing PaperTradingService
    # For live trades: integrate with your existing live trading service
    
    try:
        rows = get_trades_from_db(mode, strategy)
            
        # Normalize shape expected by frontend
        out = []
        for t in rows:
            out.append({
                "id": str(t.get("id", "")),
                "symbol": t.get("symbol", "-"),
                "side": t.get("side", "-"),
                "strategy": t.get("strategy", "-"),
                "pnl_abs": t.get("pnl_abs"),
                "pnl_pct": t.get("pnl_pct"),
                "time": t.get("opened_at", ""),
                "status": t.get("status", "unknown"),
                "leverage": t.get("leverage", 1),
            })
        return out
    except Exception as e:
        # Return empty list on error to prevent UI breakage
        return []