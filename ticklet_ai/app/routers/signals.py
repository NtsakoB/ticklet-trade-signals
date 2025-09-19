from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from typing import Optional, List, Literal
from datetime import datetime, timezone
import os
from supabase import create_client, Client

router = APIRouter(prefix="/api", tags=["signals"])

def get_supabase_client() -> Client:
    url = os.environ["SUPABASE_URL"]
    key = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
    return create_client(url, key)

class SignalIn(BaseModel):
    symbol: str
    side: Literal["BUY", "SELL"] = "BUY"
    entry_price: float
    volatility_pct: Optional[float] = None
    leverage: Optional[int] = None
    anomaly: Optional[float] = None
    confidence: Optional[float] = 0.5
    targets: Optional[List[float]] = None
    stop_loss: Optional[float] = None
    strategy: Optional[str] = "TickletAlpha"
    ai_summary: Optional[str] = None
    status: Optional[str] = "active"

@router.post("/signals")
def create_signal(s: SignalIn):
    """Create a new trading signal"""
    try:
        supabase = get_supabase_client()
        
        # Prepare data for insertion
        data = s.model_dump()
        if data.get("targets"):
            # Convert list to jsonb format expected by database
            targets_dict = {}
            for i, target in enumerate(data["targets"][:3], 1):
                targets_dict[f"tp{i}"] = target
            data["targets"] = targets_dict
        
        response = supabase.table("signals").insert(data).execute()
        
        if response.data:
            return response.data[0]
        else:
            raise HTTPException(status_code=500, detail="Failed to create signal")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.post("/signals/generate")
def generate_signal():
    """Generate a signal using current market conditions"""
    # This would typically integrate with your signal generation logic
    # For now, create a sample signal
    import random
    
    symbols = ["BTCUSDT", "ETHUSDT", "XRPUSDT", "SOLUSDT"]
    symbol = random.choice(symbols)
    entry_price = round(random.uniform(20000, 70000), 2)
    
    signal_data = SignalIn(
        symbol=symbol,
        side="BUY",
        entry_price=entry_price,
        confidence=round(random.uniform(0.6, 0.9), 2),
        targets=[
            round(entry_price * 1.02, 2),
            round(entry_price * 1.05, 2),
            round(entry_price * 1.08, 2)
        ],
        stop_loss=round(entry_price * 0.97, 2),
        ai_summary=f"AI detected bullish momentum for {symbol} with high confidence",
        strategy="TickletAlpha"
    )
    
    created_signal = create_signal(signal_data)
    
    return {
        "emitted": [symbol],
        "missed": [],
        "checked": 1,
        "timestamp": int(datetime.now().timestamp()),
        "signal": created_signal
    }

@router.post("/signals/refresh")
def refresh_missed_signals():
    """Manually trigger missed signal classification"""
    try:
        supabase = get_supabase_client()
        response = supabase.rpc("classify_missed_signals", {"p_minutes": 60}).execute()
        count = response.data if response.data is not None else 0
        return {"classified_count": count, "message": f"Classified {count} signals as missed"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to classify missed signals: {str(e)}")