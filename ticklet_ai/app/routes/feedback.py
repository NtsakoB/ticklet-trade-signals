from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from supabase import create_client
import os
from typing import Optional, Dict, Any
from datetime import datetime

router = APIRouter()

# Initialize Supabase client
supabase_url = os.getenv("TICKLET_SUPABASE_URL")
supabase_key = os.getenv("TICKLET_SUPABASE_ANON_KEY")
supabase = None

if supabase_url and supabase_key:
    supabase = create_client(supabase_url, supabase_key)

class FeedbackRequest(BaseModel):
    signal_id: str
    outcome: str  # "profit", "loss", "pending"
    profit_loss: Optional[float] = None
    notes: Optional[str] = None
    strategy: Optional[str] = None

class LogRequest(BaseModel):
    level: str  # "info", "warning", "error"
    message: str
    data: Optional[Dict[str, Any]] = None
    source: Optional[str] = "ticklet_ai"

@router.post("/log")
def log_feedback(request: LogRequest):
    """Log feedback or system events"""
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase not configured")
    
    try:
        # Prepare log entry
        log_entry = {
            "level": request.level,
            "message": request.message,
            "data": request.data or {},
            "source": request.source,
            "timestamp": datetime.now().isoformat()
        }
        
        # Insert into chat_logs table (or create a dedicated logs table)
        result = supabase.table("chat_logs").insert({
            "conversation": log_entry,
            "strategy": request.source,
            "created_at": datetime.now().isoformat()
        }).execute()
        
        return {
            "status": "logged",
            "log_id": result.data[0]["id"] if result.data else None,
            "message": "Feedback logged successfully"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Logging failed: {str(e)}")

@router.post("/signal-outcome")
def log_signal_outcome(request: FeedbackRequest):
    """Log trading signal outcome"""
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase not configured")
    
    try:
        # Prepare feedback entry
        feedback_entry = {
            "signal_id": request.signal_id,
            "outcome": request.outcome,
            "profit_loss": request.profit_loss,
            "notes": request.notes,
            "strategy": request.strategy,
            "timestamp": datetime.now().isoformat()
        }
        
        # Log to database
        result = supabase.table("chat_logs").insert({
            "conversation": feedback_entry,
            "strategy": request.strategy or "unknown",
            "created_at": datetime.now().isoformat()
        }).execute()
        
        return {
            "status": "recorded",
            "feedback_id": result.data[0]["id"] if result.data else None,
            "message": f"Signal outcome recorded: {request.outcome}"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Signal outcome logging failed: {str(e)}")

@router.get("/test")
def test_supabase():
    """Test Supabase connection"""
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase not configured")
    
    try:
        # Test query
        result = supabase.table("chat_logs").select("*").limit(1).execute()
        return {
            "status": "connected",
            "table_accessible": True,
            "message": "Supabase connection is operational"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Supabase connection failed: {str(e)}")