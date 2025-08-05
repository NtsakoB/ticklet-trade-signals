from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import os
from typing import Optional, Dict, Any
from datetime import datetime

router = APIRouter()

class SignalRequest(BaseModel):
    symbol: str
    action: str  # "BUY" or "SELL"
    price: float
    confidence: Optional[float] = 0.5
    strategy: Optional[str] = "ticklet-alpha"
    stop_loss: Optional[float] = None
    take_profit: Optional[float] = None

class SignalResponse(BaseModel):
    signal_id: str
    symbol: str
    action: str
    price: float
    confidence: float
    strategy: str
    timestamp: str
    status: str
    message: str

@router.post("/", response_model=SignalResponse)
def generate_signal(request: SignalRequest):
    """Generate a trading signal"""
    try:
        # Generate unique signal ID
        signal_id = f"{request.symbol}_{int(datetime.now().timestamp())}"
        
        # Validate signal
        if request.action not in ["BUY", "SELL"]:
            raise HTTPException(status_code=400, detail="Action must be 'BUY' or 'SELL'")
        
        if request.price <= 0:
            raise HTTPException(status_code=400, detail="Price must be positive")
        
        # Create signal response
        signal = SignalResponse(
            signal_id=signal_id,
            symbol=request.symbol,
            action=request.action,
            price=request.price,
            confidence=request.confidence,
            strategy=request.strategy,
            timestamp=datetime.now().isoformat(),
            status="generated",
            message=f"Signal generated for {request.symbol} at {request.price}"
        )
        
        return signal
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Signal generation failed: {str(e)}")

@router.get("/test")
def test_signal_generator():
    """Test signal generation endpoint"""
    return {
        "status": "operational",
        "message": "Signal generator is ready",
        "supported_actions": ["BUY", "SELL"],
        "default_strategy": "ticklet-alpha"
    }

@router.post("/validate")
def validate_signal(signal_data: Dict[str, Any]):
    """Validate signal parameters"""
    required_fields = ["symbol", "action", "price"]
    missing_fields = [field for field in required_fields if field not in signal_data]
    
    if missing_fields:
        return {
            "valid": False,
            "missing_fields": missing_fields,
            "message": f"Missing required fields: {', '.join(missing_fields)}"
        }
    
    # Additional validation
    if signal_data.get("action") not in ["BUY", "SELL"]:
        return {
            "valid": False,
            "message": "Action must be 'BUY' or 'SELL'"
        }
    
    if not isinstance(signal_data.get("price"), (int, float)) or signal_data["price"] <= 0:
        return {
            "valid": False,
            "message": "Price must be a positive number"
        }
    
    return {
        "valid": True,
        "message": "Signal parameters are valid"
    }