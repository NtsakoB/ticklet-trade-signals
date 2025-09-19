"""
FastAPI router for persisting and retrieving trading signals.
This router provides endpoints to save new signals and fetch recent signals
with the correct entry price and all generated fields.
"""

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
import time
import uuid
from datetime import datetime

router = APIRouter(prefix="/api/signals", tags=["signals-persistence"])

# In-memory storage for signals (can be swapped to Supabase later)
_signals_storage: List[Dict[str, Any]] = []

class SignalCreate(BaseModel):
    """Model for creating a new trading signal"""
    symbol: str = Field(..., description="Trading pair symbol")
    type: str = Field(..., description="Signal type (BUY/SELL)")
    entry_price: float = Field(..., description="Entry price for the signal")
    entry_low: Optional[float] = Field(None, description="Low entry range")
    entry_high: Optional[float] = Field(None, description="High entry range")
    side: str = Field(..., description="Trade side (LONG/SHORT)")
    confidence: float = Field(..., ge=0, le=1, description="Signal confidence (0-1)")
    stop_loss: Optional[float] = Field(None, description="Stop loss price")
    targets: Optional[List[float]] = Field(None, description="Target prices")
    rr_ratio: Optional[float] = Field(None, description="Risk-reward ratio")
    volume: Optional[float] = Field(None, description="Trading volume")
    change_pct: Optional[float] = Field(None, description="Price change percentage")
    metadata: Optional[Dict[str, Any]] = Field(None, description="Additional metadata")

class SignalResponse(BaseModel):
    """Model for signal response"""
    id: str
    symbol: str
    type: str
    entry_price: float
    side: str
    confidence: float
    timestamp: str
    entry_low: Optional[float] = None
    entry_high: Optional[float] = None
    stop_loss: Optional[float] = None
    targets: Optional[List[float]] = None
    rr_ratio: Optional[float] = None
    volume: Optional[float] = None
    change_pct: Optional[float] = None
    metadata: Optional[Dict[str, Any]] = None

@router.post("/", response_model=SignalResponse)
def create_signal(signal: SignalCreate) -> SignalResponse:
    """
    Save a new trading signal with all generated fields including entry_price.
    This endpoint persists the exact entry_price used by the signal generator.
    """
    # Generate unique ID
    signal_id = str(uuid.uuid4())
    
    # Create timestamp
    timestamp = datetime.utcnow().isoformat() + "Z"
    
    # Create signal record
    signal_record = {
        "id": signal_id,
        "symbol": signal.symbol,
        "type": signal.type,
        "entry_price": signal.entry_price,
        "side": signal.side,
        "confidence": signal.confidence,
        "timestamp": timestamp,
        "entry_low": signal.entry_low,
        "entry_high": signal.entry_high,
        "stop_loss": signal.stop_loss,
        "targets": signal.targets or [],
        "rr_ratio": signal.rr_ratio,
        "volume": signal.volume,
        "change_pct": signal.change_pct,
        "metadata": signal.metadata or {}
    }
    
    # Store in memory
    _signals_storage.append(signal_record)
    
    # Keep only the latest 1000 signals to prevent memory issues
    if len(_signals_storage) > 1000:
        _signals_storage.pop(0)
    
    return SignalResponse(**signal_record)

@router.get("/", response_model=List[SignalResponse])
def get_signals(
    type: str = Query("recent", description="Type of signals to fetch"),
    limit: int = Query(10, ge=1, le=100, description="Number of signals to return")
) -> List[SignalResponse]:
    """
    Fetch recent trading signals with the exact entry_price from storage.
    For type='recent', returns the most recently created signals.
    """
    if type == "recent":
        # Return the most recent signals, sorted by timestamp descending
        recent_signals = sorted(
            _signals_storage, 
            key=lambda x: x["timestamp"], 
            reverse=True
        )[:limit]
        
        return [SignalResponse(**signal) for signal in recent_signals]
    
    # For other types, return empty list for now
    # This can be extended later for filtering by different criteria
    return []

@router.get("/count")
def get_signals_count() -> Dict[str, int]:
    """Get the total count of stored signals"""
    return {"total_signals": len(_signals_storage)}

@router.delete("/")
def clear_signals() -> Dict[str, str]:
    """Clear all stored signals (for testing/reset purposes)"""
    global _signals_storage
    _signals_storage.clear()
    return {"message": "All signals cleared"}