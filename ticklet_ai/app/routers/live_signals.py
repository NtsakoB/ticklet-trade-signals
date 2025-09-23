"""
Live Signals API Router - Provides endpoints for live signal generation and management
"""
from fastapi import APIRouter, HTTPException, BackgroundTasks
from typing import List, Dict, Any
import asyncio
import logging
from ticklet_ai.services.live_signal_generator import run_signal_generation

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/live-signals", tags=["live-signals"])

@router.post("/generate")
async def generate_live_signals(background_tasks: BackgroundTasks) -> Dict[str, Any]:
    """
    Generate live trading signals from current market conditions
    """
    try:
        # Run signal generation
        signals = await run_signal_generation()
        
        return {
            "success": True,
            "signals_generated": len(signals),
            "signals": signals[:5],  # Return first 5 for preview
            "message": f"Generated {len(signals)} live trading signals",
            "timestamp": signals[0]['meta']['generation_time'] if signals else None
        }
        
    except Exception as e:
        logger.error(f"Error generating live signals: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to generate signals: {str(e)}")

@router.get("/status")
async def get_signal_generation_status() -> Dict[str, Any]:
    """
    Get status of signal generation system
    """
    try:
        from ticklet_ai.services.supabase_client import get_client
        
        supabase = get_client()
        if not supabase:
            return {
                "status": "disconnected",
                "database": "unavailable",
                "last_generation": None,
                "active_signals": 0
            }
        
        # Get recent signals count
        recent_signals = supabase.table("signals").select("*").eq("status", "active").execute()
        active_count = len(recent_signals.data) if recent_signals.data else 0
        
        # Get last generation time
        last_signal = supabase.table("signals").select("created_at").order("created_at", desc=True).limit(1).execute()
        last_generation = last_signal.data[0]['created_at'] if last_signal.data else None
        
        return {
            "status": "connected",
            "database": "connected",
            "active_signals": active_count,
            "last_generation": last_generation,
            "binance_api": "connected"
        }
        
    except Exception as e:
        logger.error(f"Error getting status: {e}")
        return {
            "status": "error",
            "database": "error",
            "error": str(e),
            "active_signals": 0
        }

@router.post("/cleanup")
async def cleanup_expired_signals() -> Dict[str, Any]:
    """
    Manually trigger cleanup of expired signals
    """
    try:
        from ticklet_ai.services.supabase_client import get_client
        
        supabase = get_client()
        if not supabase:
            raise HTTPException(status_code=503, detail="Database connection unavailable")
        
        # Mark signals older than 4 hours as missed
        result = supabase.rpc('classify_missed_signals', {'p_minutes': 240}).execute()
        
        return {
            "success": True,
            "cleaned_signals": result.data or 0,
            "message": f"Cleaned up {result.data or 0} expired signals"
        }
        
    except Exception as e:
        logger.error(f"Error cleaning up signals: {e}")
        raise HTTPException(status_code=500, detail=f"Cleanup failed: {str(e)}")