from fastapi import APIRouter, Query, HTTPException
from typing import Optional
import logging

router = APIRouter()
logging.basicConfig(level=logging.ERROR)

@router.get("/api/learning_entries")
async def get_learning_entries(
    strategy: Optional[str] = Query(None),
    offset: int = Query(0, ge=0),
    limit: int = Query(25, ge=1, le=100)
):
    try:
        valid_strategies = ["ecosystem", "growth", "performance"]

        if strategy and strategy not in valid_strategies:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid strategy. Valid options are: {', '.join(valid_strategies)}"
            )

        query = supabase.table("learning_entries") \
                        .select("*") \
                        .order("timestamp", desc=True) \
                        .range(offset, offset + limit - 1)

        if strategy:
            query = query.eq("strategy", strategy)

        result = query.execute()

        return {
            "status": "ok",
            "data": result.data,
            "metadata": {
                "total": len(result.data),
                "offset": offset,
                "limit": limit
            }
        }
    except Exception as e:
        logging.error(f"Error fetching learning entries: {e}")
        return {"status": "error", "message": str(e)}


@router.get("/api/signal_score_log")
async def export_signal_scores(
    offset: int = Query(0, ge=0),
    limit: int = Query(500, ge=1, le=1000)
):
    try:
        result = supabase.table("signal_scores") \
                         .select("symbol, strategy, rsi, macd, anomaly, confidence, timestamp") \
                         .order("timestamp", desc=True) \
                         .range(offset, offset + limit - 1) \
                         .execute()

        if not result.data:
            return {"status": "ok", "data": [], "message": "No signal scores found."}

        return {"status": "ok", "data": result.data}
    except Exception as e:
        logging.error(f"Error fetching signal scores: {e}")
        return {"status": "error", "message": "An error occurred while fetching signal scores."}