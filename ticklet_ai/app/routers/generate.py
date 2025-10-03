"""
Signal generation endpoint - triggers live signal generation
"""
from fastapi import APIRouter, HTTPException
from typing import Dict, Any
from ...services.live_signal_generator import run_signal_generation

router = APIRouter(prefix="/api/signals", tags=["signal-generation"])

@router.post("/generate")
async def generate_signals() -> Dict[str, Any]:
    """
    Trigger live signal generation process
    
    Returns:
        Summary of signal generation including count of new signals
    """
    try:
        signals = await run_signal_generation()
        
        return {
            "success": True,
            "count": len(signals),
            "signals": signals[:5],  # Preview first 5
            "message": f"Generated {len(signals)} new trading signals"
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Signal generation failed: {str(e)}"
        )
