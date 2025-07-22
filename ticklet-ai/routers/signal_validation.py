from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any
import pandas as pd
from ticklet_ai.utils.signal_filter import should_generate_signal

router = APIRouter()

class SignalValidationRequest(BaseModel):
    candles: List[Dict[str, Any]]
    entry_price: float
    direction: str
    strategy_id: str
    symbol: str

class SignalValidationResponse(BaseModel):
    valid: bool
    details: Dict[str, Any]
    symbol: str

@router.post("/validate_signal", response_model=SignalValidationResponse)
async def validate_signal(request: SignalValidationRequest):
    """
    Validate a proposed trade signal using the global safety filter.
    """
    try:
        # Convert candles data to DataFrame
        df = pd.DataFrame(request.candles)
        
        # Ensure required columns exist
        required_columns = ['open', 'high', 'low', 'close', 'volume']
        if not all(col in df.columns for col in required_columns):
            raise HTTPException(status_code=400, detail="Missing required OHLCV data")
        
        # Add bid/ask columns if missing (simulate small spread)
        if 'bid' not in df.columns:
            df['bid'] = df['close'] * 0.999
        if 'ask' not in df.columns:
            df['ask'] = df['close'] * 1.001
        
        # Apply the global signal filter
        is_valid, result = should_generate_signal(
            df, 
            request.entry_price, 
            request.direction, 
            request.strategy_id
        )
        
        return SignalValidationResponse(
            valid=is_valid,
            details=result,
            symbol=request.symbol
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Signal validation failed: {str(e)}")

@router.get("/health")
async def health_check():
    """Health check endpoint for signal validation service."""
    return {"status": "healthy", "service": "signal_validation"}